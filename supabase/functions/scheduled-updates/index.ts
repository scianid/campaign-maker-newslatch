import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Import shared utilities
import { handleCors, createErrorResponse, createSuccessResponse } from '../rss-feeds/http-utils.ts';
import { generateAIContent } from '../rss-feeds/ai-generate-logic.ts';
import { InsufficientCreditsError } from '../rss-feeds/credits.ts';
import { messageTo, sendPhotoWithCaption } from './telegram.ts';

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCors();
  }

  try {
    // Only handle GET requests
    if (req.method !== 'GET') {
      return createErrorResponse('Method not allowed', 'This endpoint only accepts GET requests', 405);
    }

    // Verify API key authentication
    const apiKey = req.headers.get('x-api-key');
    const expectedApiKey = Deno.env.get('SCHEDULER_API_KEY');

    if (!apiKey) {
      return createErrorResponse('Missing API key', 'x-api-key header is required', 401);
    }

    if (!expectedApiKey) {
      console.error('❌ SCHEDULER_API_KEY not configured in environment');
      return createErrorResponse('Server configuration error', 'API key not configured', 500);
    }

    if (apiKey !== expectedApiKey) {
      console.warn('⚠️ Invalid API key attempt');
      return createErrorResponse('Invalid API key', 'The provided API key is not valid', 403);
    }

    console.log('✅ API key authenticated');

    // Get user_id and force_update from query parameters
    const url = new URL(req.url);
    const userId = url.searchParams.get('user_id');
    const forceUpdate = url.searchParams.get('force_update') === 'true';

    if (!userId) {
      return createErrorResponse('Missing user_id', 'user_id query parameter is required', 400);
    }

    // Create Supabase client with service role for admin access
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔔 Processing scheduled updates for user:', userId);
    if (forceUpdate) {
      console.log('⚡ Force update mode enabled - bypassing schedule check');
    }

    // Get the current hour in UTC
    const currentHour = new Date().getUTCHours();
    console.log('⏰ Current UTC hour:', currentHour);

    // Find the first campaign with get_updates = true for this user
    // Optionally filter by updates_hour matching current hour
    const { data: campaigns, error: campaignError } = await supabaseClient
      .from('campaigns')
      .select('id, name, get_updates, updates_hour')
      .eq('user_id', userId)
      .eq('get_updates', true)
      .order('created_at', { ascending: true })
      .limit(1);

    if (campaignError) {
      console.error('❌ Error fetching campaigns:', campaignError);
      return createErrorResponse(
        'Failed to fetch campaigns',
        campaignError.message,
        500
      );
    }

    if (!campaigns || campaigns.length === 0) {
      console.log('ℹ️ No campaigns with updates enabled found for user');
      return createSuccessResponse({
        message: 'No campaigns with updates enabled',
        processed: false
      });
    }

    const campaign = campaigns[0];
    console.log('📋 Found campaign:', {
      id: campaign.id,
      name: campaign.name,
      updates_hour: campaign.updates_hour
    });

    // Check if it's the right hour for updates (unless force_update is true)
    if (!forceUpdate && campaign.updates_hour !== undefined && campaign.updates_hour !== currentHour) {
      console.log(`⏰ Skipping - Campaign scheduled for ${campaign.updates_hour}:00 UTC, current is ${currentHour}:00 UTC`);
      return createSuccessResponse({
        message: 'Not the scheduled time for updates',
        campaign_id: campaign.id,
        campaign_name: campaign.name,
        scheduled_hour: campaign.updates_hour,
        current_hour: currentHour,
        processed: false
      });
    }

    if (forceUpdate) {
      console.log('⚡ Bypassing schedule check due to force_update');
    }

    console.log('🤖 Calling AI generation logic for campaign:', campaign.id);

    // Call shared AI generation logic directly (no HTTP overhead)
    const result = await generateAIContent(supabaseClient, campaign.id, userId);

    if (!result.success) {
      console.error('❌ AI generation failed:', result);
      return createErrorResponse(
        'AI generation failed',
        result.error || result.details || 'Unknown error from AI generation',
        500
      );
    }

    console.log('✅ AI content generated successfully');

    // Send notification to user via Telegram if they have telegram_id configured
    try {
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('telegram_id')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.warn('⚠️ Could not fetch profile for Telegram notification:', profileError);
      } else if (profile?.telegram_id) {
        console.log('📱 Sending Telegram notification to user');
        
        // Use the saved_items from the result
        const aiItems = result.saved_items || [];

        if (aiItems.length > 0) {
          console.log(`📤 Sending ${aiItems.length} AI items to Telegram`);
          
          // Send each AI item as a photo with caption (limit to 5 to avoid spam)
          const itemsToSend = aiItems.slice(0, 5);
          
          for (const item of itemsToSend) {
            // Use ad_placement data if available
            if (item.ad_placement && item.image_url) {
              const headline = item.ad_placement.headline || item.headline;
              const body = item.ad_placement.body || item.description;
              const cta = item.ad_placement.cta || '';
              
              const caption = `<b>${headline}</b>\n\n${body}${cta ? '\n\n' + cta : ''}`;
              await sendPhotoWithCaption(profile.telegram_id, item.image_url, caption);
            } else if (item.image_url) {
              // Fallback to headline and description if no ad_placement
              const caption = `<b>${item.headline}</b>\n\n${item.description}`;
              await sendPhotoWithCaption(profile.telegram_id, item.image_url, caption);
            } else {
              // If no image, send as text message
              const message = `📰 ${item.headline}\n\n${item.description}`;
              await messageTo(profile.telegram_id, message);
            }
          }
          
          console.log('✅ AI items sent to Telegram successfully');
        } else {
          // Fallback to simple notification if no items found
          const notificationMessage = `🎉 New AI content generated for campaign: ${campaign.name}\n\nCheck your dashboard to review the latest suggestions!`;
          await messageTo(profile.telegram_id, notificationMessage);
        }
        
        console.log('✅ Telegram notification sent successfully');
      } else {
        console.log('ℹ️ User has no telegram_id configured, skipping notification');
      }
    } catch (telegramError) {
      console.error('❌ Error sending Telegram notification:', telegramError);
      // Don't fail the whole request if Telegram notification fails
    }

    return createSuccessResponse({
      message: 'Scheduled update completed successfully',
      campaign_id: campaign.id,
      campaign_name: campaign.name,
      processed: true,
      ai_result: result
    });

  } catch (error) {
    console.error('❌ Edge function error:', error);
    
    // Handle insufficient credits error specifically
    if (error instanceof InsufficientCreditsError) {
      return createErrorResponse(
        'Insufficient credits',
        error.message,
        402
      );
    }
    
    return createErrorResponse(
      'Internal server error',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
});
