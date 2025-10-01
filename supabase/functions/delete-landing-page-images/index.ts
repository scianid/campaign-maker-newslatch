import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Import shared utilities from rss-feeds function
import { authenticateUser, createAuthenticatedClient } from '../rss-feeds/auth.ts';
import { handleCors, createErrorResponse, createSuccessResponse } from '../rss-feeds/http-utils.ts';

// Delete all images for a landing page from storage
async function deleteImagesFromStorage(
  supabaseClient: any,
  userId: string,
  landingPageId: string
): Promise<number> {
  console.log('🗑️ Deleting images for landing page:', landingPageId);
  
  const folderPath = `${userId}/${landingPageId}/`;
  
  // List all files in the folder
  const { data: files, error: listError } = await supabaseClient
    .storage
    .from('public-files')
    .list(`${userId}/${landingPageId}`);
  
  if (listError) {
    console.error('❌ Error listing files:', listError);
    throw new Error(`Failed to list files: ${listError.message}`);
  }
  
  if (!files || files.length === 0) {
    console.log('ℹ️ No images to delete');
    return 0;
  }
  
  // Delete all files
  const filePaths = files.map(file => `${userId}/${landingPageId}/${file.name}`);
  
  const { data, error: deleteError } = await supabaseClient
    .storage
    .from('public-files')
    .remove(filePaths);
  
  if (deleteError) {
    console.error('❌ Error deleting files:', deleteError);
    throw new Error(`Failed to delete files: ${deleteError.message}`);
  }
  
  console.log(`✅ Deleted ${filePaths.length} images`);
  
  return filePaths.length;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCors();
  }

  try {
    // Only handle DELETE requests
    if (req.method !== 'DELETE') {
      return createErrorResponse('Method not allowed', 'This endpoint only accepts DELETE requests', 405);
    }

    // Create authenticated Supabase client
    const supabaseClient = createAuthenticatedClient(req, createClient);

    // Verify user authentication
    const authResult = await authenticateUser(supabaseClient);
    if (!authResult.success) {
      return createErrorResponse(authResult.error!, '', 401);
    }

    const userId = authResult.user!.id;

    // Get landing page ID from request body
    const body = await req.json();
    const { landing_page_id } = body;

    // Validate required parameters
    if (!landing_page_id) {
      return createErrorResponse('Missing required parameters', 'landing_page_id is required', 400);
    }

    console.log('🚀 Starting image deletion for landing page:', landing_page_id);

    // Fetch landing page to verify ownership
    const { data: landingPage, error: fetchError } = await supabaseClient
      .from('landing_pages')
      .select(`
        *,
        ai_generated_items!inner (
          campaigns!inner (
            user_id
          )
        )
      `)
      .eq('id', landing_page_id)
      .single();

    if (fetchError || !landingPage) {
      console.error('❌ Landing page not found:', fetchError);
      return createErrorResponse(
        'Landing page not found',
        'The specified landing page does not exist or is not accessible',
        404
      );
    }

    // Verify ownership
    if (landingPage.ai_generated_items.campaigns.user_id !== userId) {
      return createErrorResponse(
        'Unauthorized',
        'You do not have permission to delete images for this landing page',
        403
      );
    }

    console.log('✅ Landing page verified, deleting images...');

    // Delete images from storage
    const deletedCount = await deleteImagesFromStorage(
      supabaseClient,
      userId,
      landing_page_id
    );

    console.log('✅ Image deletion completed');

    return createSuccessResponse({
      message: 'Images deleted successfully',
      deleted_count: deletedCount,
      landing_page_id: landing_page_id
    });

  } catch (error) {
    console.error('❌ Edge function error:', error);
    return createErrorResponse(
      'Internal server error',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
});
