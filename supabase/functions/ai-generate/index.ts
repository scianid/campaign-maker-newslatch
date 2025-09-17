import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Import shared utilities from rss-feeds function
import { authenticateUser, createAuthenticatedClient } from '../rss-feeds/auth.ts';
import { handleCors, createErrorResponse, createSuccessResponse, getUrlParams, validateRequiredParams } from '../rss-feeds/http-utils.ts';
import { getLatestRssContent } from '../rss-feeds/rss-filter.ts';
import { buildPrompt, runGpt } from '../rss-feeds/ai.ts';

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCors();
  }

  try {
    // Only handle POST requests for generating AI content
    if (req.method !== 'POST') {
      return createErrorResponse('Method not allowed', 'This endpoint only accepts POST requests', 405);
    }

    // Create authenticated Supabase client
    const supabaseClient = createAuthenticatedClient(req, createClient);

    // Verify user authentication
    const authResult = await authenticateUser(supabaseClient);
    if (!authResult.success) {
      return createErrorResponse(authResult.error!, '', 401);
    }

    // Get campaign ID from request body or URL params
    let campaignId: string;
    
    try {
      const body = await req.json();
      campaignId = body.campaignId;
    } catch {
      // Fallback to URL params if body parsing fails
      const params = getUrlParams(req);
      const validation = validateRequiredParams(params, ['campaignId']);
      
      if (!validation.valid) {
        return createErrorResponse(
          'Missing required parameters',
          'campaignId is required either in request body or as URL parameter',
          400
        );
      }
      
      campaignId = params.get('campaignId')!;
    }

    console.log('🤖 Starting AI content generation for campaign:', campaignId);

    // Fetch RSS content for the campaign
    const rssResult = await getLatestRssContent(supabaseClient, campaignId);
    
    if (!rssResult.success) {
      const status = rssResult.error === 'Campaign not found' ? 404 : 500;
      return createErrorResponse(rssResult.error!, rssResult.details, status);
    }

    // Prepare data for AI analysis
    const news = (rssResult.items || []).map(item => ({ 
      headline: item.title, 
      link: item.link 
    }));
    const tags = rssResult.campaign?.rss_categories || [];
    
    // Get campaign details for better AI context
    const { data: campaignDetails } = await supabaseClient
      .from('campaigns')
      .select('name, description, url, tags')
      .eq('id', campaignId)
      .single();
    
    const campaignInfo = campaignDetails || {
      name: 'Unknown Campaign',
      description: '',
      url: '',
      tags: []
    };
    
    console.log('🎯 AI Analysis Input:', {
      newsCount: news.length,
      rssCategories: tags.length,
      campaignName: campaignInfo.name
    });
    
    // Validate we have enough data for AI analysis
    if (news.length === 0) {
      return createErrorResponse(
        'No RSS content found', 
        'No RSS items found for this campaign. Please ensure RSS feeds are configured and contain recent content.',
        400
      );
    }
    
    if (tags.length === 0) {
      return createErrorResponse(
        'No RSS categories configured', 
        'Please configure RSS categories for this campaign before generating AI content.',
        400
      );
    }

    // Run AI analysis
    try {
      console.log('🤖 Running AI analysis...');
      const prompt = buildPrompt(news, tags, campaignInfo);
      const gptResponse = await runGpt(prompt);
      
      const aiResults = JSON.parse(gptResponse);
      console.log('✅ AI Analysis completed successfully');
      
      // Save AI-generated items to database
      if (aiResults.results && aiResults.results.length > 0) {
        console.log('💾 Saving AI items to database...');
        
        const aiItemsToSave = aiResults.results.map((item: any) => ({
          campaign_id: campaignId,
          headline: item.headline,
          clickbait: item.clickbait,
          link: item.link,
          relevance_score: item.relevance_score,
          trend: item.trend,
          description: item.description,
          tooltip: item.tooltip,
          ad_placement: item.ad_placement || null,
          is_published: false // Default to unpublished
        }));
        
        const { data: savedItems, error: saveError } = await supabaseClient
          .from('ai_generated_items')
          .insert(aiItemsToSave)
          .select();
        
        if (saveError) {
          console.error('❌ Failed to save AI items:', saveError);
          return createErrorResponse(
            'Failed to save AI content',
            saveError.message,
            500
          );
        }
        
        console.log('✅ Saved AI items to database:', savedItems?.length || 0);
        
        return createSuccessResponse({
          message: 'AI content generated successfully',
          items_generated: savedItems?.length || 0,
          campaign_id: campaignId,
          ai_analysis: aiResults
        });
      } else {
        return createErrorResponse(
          'No AI content generated',
          'AI analysis completed but no relevant content was generated. Try adjusting your RSS categories or feeds.',
          400
        );
      }
      
    } catch (aiError) {
      console.error('❌ AI Analysis failed:', aiError);
      return createErrorResponse(
        'AI generation failed',
        aiError instanceof Error ? aiError.message : 'Unknown AI error',
        500
      );
    }

  } catch (error) {
    console.error('Edge function error:', error);
    return createErrorResponse(
      'Internal server error',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
});