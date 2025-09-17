// Request handlers for different RSS feeds operations

import { getFilteredRssFeeds, getLatestRssContent } from './rss-filter.ts';
import { buildPrompt, runGpt } from './ai.ts';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  getUrlParams, 
  validateRequiredParams 
} from './http-utils.ts';

/**
 * Handle GET requests for RSS feeds
 */
export async function handleGetRssFeeds(supabaseClient: any, req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
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
    const action = params.get('action') || 'feeds'; // Default to feeds list
    
    if (action === 'content') {
      // Fetch actual RSS content (latest 30 items) and run AI analysis
      const result = await getLatestRssContent(supabaseClient, campaignId);
      
      if (!result.success) {
        const status = result.error === 'Campaign not found' ? 404 : 500;
        return createErrorResponse(result.error!, result.details, status);
      }

      // Prepare news and campaign data for AI analysis
      const news = (result.items || []).map(item => ({ headline: item.title, link: item.link }));
      const tags = result.campaign?.rss_categories || [];
      
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
      
      // Log subset of news and campaign data for debugging
      console.log('🎯 AI Analysis Input:');
      console.log('📰 News count:', news.length);
      console.log('🏷️ RSS Categories:', tags);
      console.log('🏢 Campaign:', campaignInfo.name);
      
      // Run AI analysis if news and tags are available
      if (news.length > 0 && tags.length > 0) {
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
              ad_placement: item.ad_placement || null
            }));
            
            const { data: savedItems, error: saveError } = await supabaseClient
              .from('ai_generated_items')
              .insert(aiItemsToSave)
              .select();
            
            if (saveError) {
              console.error('❌ Failed to save AI items:', saveError);
            } else {
              console.log('✅ Saved AI items to database:', savedItems?.length || 0);
            }
          }
          
          return createSuccessResponse({
            rss: result,
            ai_analysis: aiResults
          });
        } catch (aiError) {
          console.error('❌ AI Analysis failed:', aiError);
          return createSuccessResponse(result);
        }
      } else {
        console.log('⚠️ Skipping AI analysis - insufficient data');
        return createSuccessResponse(result);
      }
      
    } else if (action === 'ai-items') {
      // Fetch saved AI-generated items for the campaign with pagination and filtering
      try {
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const status = url.searchParams.get('status') || 'all';
        const scoreRange = url.searchParams.get('scoreRange') || 'all';
        const dateRange = url.searchParams.get('dateRange') || 'all';
        const sortBy = url.searchParams.get('sortBy') || 'created_at';
        const sortOrder = url.searchParams.get('sortOrder') || 'desc';
        
        const offset = (page - 1) * limit;
        
        console.log('🔍 AI Items Filter Debug:', {
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
        
        let query = supabaseClient
          .from('ai_generated_items')
          .select('*', { count: 'exact' })
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
        } else if (dateRange === 'week') {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          weekAgo.setHours(0, 0, 0, 0);
          query = query.gte('created_at', weekAgo.toISOString());
        } else if (dateRange === 'month') {
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          monthAgo.setHours(0, 0, 0, 0);
          query = query.gte('created_at', monthAgo.toISOString());
        }
        
        // Apply sorting
        const ascending = sortOrder === 'asc';
        if (sortBy === 'relevance_score') {
          query = query.order('relevance_score', { ascending });
        } else if (sortBy === 'trend') {
          query = query.order('trend', { ascending });
        } else {
          query = query.order('created_at', { ascending });
        }
        
        // Apply pagination
        query = query.range(offset, offset + limit - 1);
        
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
          campaign_id: campaignId
        });
      } catch (error) {
        console.error('Error fetching AI items:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return createErrorResponse('Internal server error', errorMessage);
      }
      
    } else {
      // Default: just return the list of RSS feeds
      const result = await getFilteredRssFeeds(supabaseClient, campaignId);
      
      if (!result.success) {
        const status = result.error === 'Campaign not found' ? 404 : 500;
        return createErrorResponse(result.error!, result.details, status);
      }

      return createSuccessResponse(result);
    }

  } catch (error) {
    console.error('Error in handleGetRssFeeds:', error);
    return createErrorResponse(
      'Internal server error',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Handle POST requests (for future functionality)
 */
export async function handlePostRssFeeds(supabaseClient: any, req: Request): Promise<Response> {
  // Placeholder for future POST functionality
  return createErrorResponse('POST method not implemented yet', '', 501);
}

/**
 * Handle PUT requests (for future functionality)  
 */
export async function handlePutRssFeeds(supabaseClient: any, req: Request): Promise<Response> {
  // Placeholder for future PUT functionality
  return createErrorResponse('PUT method not implemented yet', '', 501);
}

/**
 * Handle DELETE requests (for future functionality)
 */
export async function handleDeleteRssFeeds(supabaseClient: any, req: Request): Promise<Response> {
  // Placeholder for future DELETE functionality
  return createErrorResponse('DELETE method not implemented yet', '', 501);
}