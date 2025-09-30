import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Import shared utilities from rss-feeds function
import { handleCors, createErrorResponse, createSuccessResponse } from '../rss-feeds/http-utils.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCors();
  }

  try {
    // Only handle GET requests for public access
    if (req.method !== 'GET') {
      return createErrorResponse('Method not allowed', 'This endpoint only accepts GET requests', 405);
    }

    // Create Supabase client (no auth required for public access)
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    
    // The URL will be like: /functions/v1/public-landing-page/my-slug
    // So we need to find the slug after 'public-landing-page'
    const functionNameIndex = pathSegments.findIndex(segment => segment === 'public-landing-page');
    
    if (functionNameIndex === -1 || functionNameIndex + 1 >= pathSegments.length) {
      return createErrorResponse('Missing slug', 'Landing page slug is required', 400);
    }

    const slug = pathSegments[functionNameIndex + 1];

    console.log('🔍 Fetching public landing page with slug:', slug);

    // First, let's check if any landing pages exist at all
    const { data: allPages, error: countError } = await supabase
      .from('landing_pages')
      .select('slug, is_active, title')
      .limit(10);
    
    console.log('📊 Available landing pages:', allPages);
    console.log('🎯 Looking for slug:', slug);

    // Fetch landing page by slug (using anon key for public access)
    const { data: landingPage, error } = await supabase
      .from('landing_pages')
      .select(`
        *,
        ai_generated_items (
          headline,
          clickbait,
          description,
          link,
          trend,
          campaigns (
            name,
            url
          )
        )
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) {
      console.log('❌ Landing page query error:', error);
      return createErrorResponse(
        'Landing page not found', 
        `Database error: ${error.message}`, 
        404
      );
    }

    if (!landingPage) {
      console.log('❌ Landing page not found for slug:', slug);
      return createErrorResponse(
        'Landing page not found', 
        'The requested landing page does not exist or is not active', 
        404
      );
    }

    // Increment view count using service role to bypass RLS
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    const { error: updateError } = await supabaseService
      .from('landing_pages')
      .update({ 
        view_count: (landingPage.view_count || 0) + 1 
      })
      .eq('id', landingPage.id);

    if (updateError) {
      console.error('⚠️ Failed to update view count:', updateError);
      // Don't fail the request if view count update fails
    }

    console.log('✅ Landing page found and view count updated');

    return createSuccessResponse({
      landing_page: landingPage
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