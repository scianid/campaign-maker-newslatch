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
    
    let result;
    
    if (action === 'content') {
      // Fetch actual RSS content (latest 30 items)
      result = await getLatestRssContent(supabaseClient, campaignId);
      
      if (!result.success) {
        const status = result.error === 'Campaign not found' ? 404 : 500;
        return createErrorResponse(result.error!, result.details, status);
      }

      // Prepare news and tags for AI analysis
      const news = (result.items || []).map(item => ({ headline: item.title, link: item.link }));
      // Use campaign tags from rss_categories
      const tags = result.campaign?.rss_categories || [];
      
      // Log subset of news and tags for debugging
      console.log('🎯 AI Analysis Input:');
      console.log('📰 News count:', news.length);
      console.log('🏷️ Tags:', tags);
      if (news.length > 0) {
        console.log('📋 First 3 news items:');
        news.slice(0, 3).forEach((item, idx) => {
          console.log(`  ${idx + 1}. "${item.headline}" -> ${item.link}`);
        });
      }
      
      // Run AI analysis if news and tags are available
      if (news.length > 0 && tags.length > 0) {
        try {
          console.log('🤖 Running AI analysis...');
          const prompt = buildPrompt(news, tags);
          const gptResponse = await runGpt(prompt);
          
          console.log('🔍 Raw GPT response received, length:', gptResponse.length);
          
          let aiResults;
          try {
            aiResults = JSON.parse(gptResponse);
          } catch (parseError) {
            console.error('❌ JSON Parse Error:', parseError);
            console.error('📝 Raw GPT Response:', gptResponse);
            const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parse error';
            throw new Error(`Failed to parse GPT response as JSON: ${errorMessage}`);
          }
          
          console.log('✅ AI Analysis completed successfully');
          console.log('📊 AI Results count:', aiResults.results?.length || 0);
          
          // Return both raw RSS and AI results
          return createSuccessResponse({
            rss: result,
            ai_analysis: aiResults
          });
        } catch (aiError) {
          console.error('❌ AI Analysis failed:', aiError);
          // Return just RSS data if AI fails
          return createSuccessResponse(result);
        }
      } else {
        // No news or tags, just return RSS data without AI analysis
        console.log('⚠️ Skipping AI analysis - insufficient data');
        console.log('📰 News items:', news.length);
        console.log('🏷️ Tags:', tags.length);
        return createSuccessResponse(result);
      }
    } else {
      // Default: just return the list of RSS feeds
      result = await getFilteredRssFeeds(supabaseClient, campaignId);
    }
    
    if (!result.success) {
      const status = result.error === 'Campaign not found' ? 404 : 500;
      return createErrorResponse(result.error!, result.details, status);
    }

    return createSuccessResponse(result);

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