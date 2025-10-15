import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get the authorization header to verify the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract JWT token from Authorization header
    const jwt = authHeader.replace('Bearer ', '');

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user authentication using the JWT token directly
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: authError?.message || 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const variantId = pathParts[pathParts.length - 1];

    switch (req.method) {
      case 'GET': {
        // Fetch variants for an AI item
        const aiItemId = url.searchParams.get('ai_item_id');
        
        if (!aiItemId) {
          return new Response(
            JSON.stringify({ error: 'ai_item_id is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Verify user owns this AI item
        const { data: aiItem, error: aiItemError } = await supabaseClient
          .from('ai_generated_items')
          .select(`
            *,
            campaigns!inner(user_id)
          `)
          .eq('id', aiItemId)
          .single();

        if (aiItemError || !aiItem) {
          return new Response(
            JSON.stringify({ error: 'AI item not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (aiItem.campaigns.user_id !== user.id) {
          return new Response(
            JSON.stringify({ error: 'Not authorized' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Fetch variants ordered by display_order
        const { data: variants, error: variantsError } = await supabaseClient
          .from('ad_variants')
          .select('*')
          .eq('ai_generated_item_id', aiItemId)
          .order('display_order', { ascending: true });

        if (variantsError) {
          throw new Error('Failed to fetch variants');
        }

        return new Response(
          JSON.stringify({
            success: true,
            variants: variants || [],
            count: variants?.length || 0,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      case 'PATCH': {
        // Update variant (favorite, image_url, etc.)
        const updateData = await req.json();
        
        if (!variantId) {
          return new Response(
            JSON.stringify({ error: 'Variant ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Verify user owns this variant
        const { data: variant, error: variantError } = await supabaseClient
          .from('ad_variants')
          .select(`
            *,
            ai_generated_items!inner(
              campaigns!inner(user_id)
            )
          `)
          .eq('id', variantId)
          .single();

        if (variantError || !variant) {
          return new Response(
            JSON.stringify({ error: 'Variant not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (variant.ai_generated_items.campaigns.user_id !== user.id) {
          return new Response(
            JSON.stringify({ error: 'Not authorized' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Update the variant
        const { data: updatedVariant, error: updateError } = await supabaseClient
          .from('ad_variants')
          .update({
            ...updateData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', variantId)
          .select()
          .single();

        if (updateError) {
          throw new Error('Failed to update variant');
        }

        return new Response(
          JSON.stringify({
            success: true,
            variant: updatedVariant,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      case 'DELETE': {
        // Delete variant
        if (!variantId) {
          return new Response(
            JSON.stringify({ error: 'Variant ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Verify user owns this variant and it's not the last one
        const { data: variant, error: variantError } = await supabaseClient
          .from('ad_variants')
          .select(`
            *,
            ai_generated_items!inner(
              campaigns!inner(user_id),
              variant_count
            )
          `)
          .eq('id', variantId)
          .single();

        if (variantError || !variant) {
          return new Response(
            JSON.stringify({ error: 'Variant not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (variant.ai_generated_items.campaigns.user_id !== user.id) {
          return new Response(
            JSON.stringify({ error: 'Not authorized' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Don't allow deletion if it's the last variant
        if (variant.ai_generated_items.variant_count <= 1) {
          return new Response(
            JSON.stringify({ error: 'Cannot delete the last variant' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Delete the variant
        const { error: deleteError } = await supabaseClient
          .from('ad_variants')
          .delete()
          .eq('id', variantId);

        if (deleteError) {
          throw new Error('Failed to delete variant');
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Variant deleted successfully',
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('❌ Edge function error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});