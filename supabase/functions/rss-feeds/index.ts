import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Import our modular utilities
import { authenticateUser, createAuthenticatedClient } from './auth.ts';
import { handleCors, createErrorResponse } from './http-utils.ts';
import { 
  handleGetRssFeeds as getRssFeeds, 
  handlePostRssFeeds as postRssFeeds, 
  handlePutRssFeeds as putRssFeeds, 
  handleDeleteRssFeeds as deleteRssFeeds 
} from './handlers.ts';

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCors();
  }

  try {
    // Create authenticated Supabase client
    const supabaseClient = createAuthenticatedClient(req, createClient);

    // Verify user authentication
    const authResult = await authenticateUser(supabaseClient);
    if (!authResult.success) {
      return createErrorResponse(authResult.error!, '', 401);
    }

    // Route to appropriate handler based on HTTP method
    switch (req.method) {
      case 'GET':
        return await getRssFeeds(supabaseClient, req);
      
      case 'POST':
        return await postRssFeeds(supabaseClient, req);
        
      case 'PUT':
        return await putRssFeeds(supabaseClient, req);
        
      case 'DELETE':
        return await deleteRssFeeds(supabaseClient, req);
      
      default:
        return createErrorResponse('Method not allowed', '', 405);
    }

  } catch (error) {
    console.error('Edge function error:', error);
    return createErrorResponse(
      'Internal server error',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
});