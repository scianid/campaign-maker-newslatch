import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Import shared utilities from rss-feeds function
import { authenticateUser, createAuthenticatedClient } from '../rss-feeds/auth.ts';
import { handleCors, createErrorResponse, createSuccessResponse, getUrlParams, validateRequiredParams } from '../rss-feeds/http-utils.ts';
import { InsufficientCreditsError } from '../rss-feeds/credits.ts';
import { generateAIContent } from '../rss-feeds/ai-generate-logic.ts';

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

    // Check if request is from service role (e.g., from scheduled function)
    const authHeader = req.headers.get('Authorization') || '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const isServiceRole = authHeader.includes(serviceRoleKey) && serviceRoleKey.length > 0;

    // Create Supabase client - use service role if authenticated as service
    const supabaseClient = isServiceRole
      ? createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          serviceRoleKey
        )
      : createAuthenticatedClient(req, createClient);

    let userId: string;
    let campaignId: string;

    // Skip user authentication if service role
    if (isServiceRole) {
      console.log('🔐 Service role authentication detected, skipping user authentication');
      // For service role requests, we'll need to get userId and campaignId from request body
      try {
        const body = await req.json();
        userId = body.userId || body.user_id;
        campaignId = body.campaignId;
        
        if (!userId) {
          return createErrorResponse(
            'Missing userId',
            'Service role requests must include userId in the request body',
            400
          );
        }
        
        if (!campaignId) {
          return createErrorResponse(
            'Missing campaignId',
            'Service role requests must include campaignId in the request body',
            400
          );
        }
      } catch (parseError) {
        return createErrorResponse(
          'Invalid request body',
          'Failed to parse request body JSON',
          400
        );
      }
    } else {
      // Verify user authentication for regular requests
      const authResult = await authenticateUser(supabaseClient);
      if (!authResult.success) {
        return createErrorResponse(authResult.error!, '', 401);
      }
      userId = authResult.user!.id;
      
      // Get campaign ID from request body or URL params
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
    }

    // Use shared AI generation logic
    const result = await generateAIContent(supabaseClient, campaignId, userId);
    
    if (!result.success) {
      const statusCode = result.error === 'Campaign not found' ? 404 : 
                        result.error === 'No RSS content found' || result.error === 'No RSS categories configured' ? 400 : 500;
      return createErrorResponse(result.error!, result.details, statusCode);
    }
    
    return createSuccessResponse({
      message: result.message,
      items_generated: result.items_generated,
      items_with_images: result.items_with_images,
      campaign_id: result.campaign_id,
      ai_analysis: result.ai_analysis,
      saved_items: result.saved_items
    });

  } catch (error) {
    console.error('Edge function error:', error);
    
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