// Request handlers for different RSS feeds operations

import { getFilteredRssFeeds, getLatestRssContent } from './rss-filter.ts';
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