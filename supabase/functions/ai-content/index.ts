import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Import shared utilities from rss-feeds function
import { authenticateUser, createAuthenticatedClient } from '../rss-feeds/auth.ts';
import { handleCors, createErrorResponse, createSuccessResponse, getUrlParams, validateRequiredParams } from '../rss-feeds/http-utils.ts';

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCors();
  }

  try {
    // Only handle GET requests for retrieving AI content
    if (req.method !== 'GET') {
      return createErrorResponse('Method not allowed', 'This endpoint only accepts GET requests', 405);
    }

    // Create authenticated Supabase client
    const supabaseClient = createAuthenticatedClient(req, createClient);

    // Verify user authentication
    const authResult = await authenticateUser(supabaseClient);
    if (!authResult.success) {
      return createErrorResponse(authResult.error!, '', 401);
    }

    // Get and validate required parameters
    const params = getUrlParams(req);
    const validation = validateRequiredParams(params, ['campaignId']);
    
    if (!validation.valid) {
      return createErrorResponse(
        'Missing required parameters',
        `Required parameters: ${validation.missing?.join(', ')}`,
        400
      );
    }

    const campaignId = params.get('campaignId')!;
    
    // Parse filter and pagination parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const status = url.searchParams.get('status') || 'all';
    const scoreRange = url.searchParams.get('scoreRange') || 'all';
    const dateRange = url.searchParams.get('dateRange') || 'all';
    const sortBy = url.searchParams.get('sortBy') || 'created_at';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    
    const offset = (page - 1) * limit;
    
    console.log('🔍 AI Content Filter Debug:', {
      campaignId,
      page,
      limit,
      status,
      scoreRange,
      dateRange,
      sortBy,
      sortOrder,
      offset
    });
    
    // Build base query - include variant counts
    let query = supabaseClient
      .from('ai_generated_items')
      .select('*, variant_count, favorite_variant_count', { count: 'exact' })
      .eq('campaign_id', campaignId);
    
    // Apply status filtering
    if (status === 'published') {
      query = query.eq('is_published', true);
      console.log('📢 Applied published filter');
    } else if (status === 'unpublished') {
      query = query.eq('is_published', false);
      console.log('📝 Applied unpublished filter');
    } else {
      console.log('📄 No status filter applied (showing all)');
    }
    
    // Apply score range filtering
    if (scoreRange === 'high') {
      query = query.gte('relevance_score', 80);
      console.log('⭐ Applied high score filter (>=80)');
    } else if (scoreRange === 'medium') {
      query = query.gte('relevance_score', 50).lt('relevance_score', 80);
      console.log('🔶 Applied medium score filter (50-79)');
    } else if (scoreRange === 'low') {
      query = query.lt('relevance_score', 50);
      console.log('📊 Applied low score filter (<50)');
    } else {
      console.log('📊 No score filter applied (all scores)');
    }
    
    // Apply date range filtering
    if (dateRange === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query = query.gte('created_at', today.toISOString());
      console.log('📅 Applied today filter');
    } else if (dateRange === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);
      query = query.gte('created_at', weekAgo.toISOString());
      console.log('📅 Applied week filter');
    } else if (dateRange === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      monthAgo.setHours(0, 0, 0, 0);
      query = query.gte('created_at', monthAgo.toISOString());
      console.log('📅 Applied month filter');
    } else {
      console.log('📅 No date filter applied (all time)');
    }
    
    // Apply sorting
    const ascending = sortOrder === 'asc';
    if (sortBy === 'relevance_score') {
      query = query.order('relevance_score', { ascending });
      console.log(`📊 Sorting by relevance_score ${ascending ? 'ascending' : 'descending'}`);
    } else if (sortBy === 'trend') {
      query = query.order('trend', { ascending });
      console.log(`📈 Sorting by trend ${ascending ? 'ascending' : 'descending'}`);
    } else {
      query = query.order('created_at', { ascending });
      console.log(`🕒 Sorting by created_at ${ascending ? 'ascending' : 'descending'}`);
    }
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1);
    
    // Execute query
    const { data: aiItems, error: aiError, count } = await query;
    
    console.log('📊 Query Results:', {
      itemsReturned: aiItems?.length || 0,
      totalCount: count || 0,
      error: aiError?.message || 'none'
    });
    
    if (aiError) {
      console.error('❌ Database query error:', aiError);
      return createErrorResponse('Failed to fetch AI items', aiError.message, 500);
    }
    
    return createSuccessResponse({
      ai_items: aiItems || [],
      count: aiItems?.length || 0,
      total: count || 0,
      page,
      limit,
      campaign_id: campaignId,
      filters: {
        status,
        scoreRange,
        dateRange,
        sortBy,
        sortOrder
      }
    });

  } catch (error) {
    console.error('Error in ai-content function:', error);
    return createErrorResponse(
      'Internal server error',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
});