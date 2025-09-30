import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { generateAdHtml } from "./compose-ads.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

// Static token for API authentication
const STATIC_API_TOKEN = Deno.env.get('STATIC_API_TOKEN')

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Check for static token authentication
    const authHeader = req.headers.get('Authorization')
    const apiKeyHeader = req.headers.get('X-API-Key')
    
    const providedToken = authHeader?.replace('Bearer ', '') || apiKeyHeader
    
    if (!providedToken || providedToken !== STATIC_API_TOKEN) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid API token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get campaign ID from URL parameters
    const url = new URL(req.url)
    const campaignId = url.searchParams.get('campaign_id')
    
    if (!campaignId) {
      return new Response(
        JSON.stringify({ error: 'Missing campaign_id parameter' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Verify campaign exists
    const { data: campaign, error: campaignError } = await supabaseClient
      .from('campaigns')
      .select('id, name')
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaign) {
      return new Response(
        JSON.stringify({ error: 'Campaign not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get the latest published AI generated item for this campaign
    const { data: latestItem, error: itemError } = await supabaseClient
      .from('ai_generated_items')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (itemError) {
      if (itemError.code === 'PGRST116') {
        // No results found
        return new Response(
          JSON.stringify({ 
            error: 'No published items found for this campaign',
            campaign: {
              id: campaign.id,
              name: campaign.name
            }
          }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      } else {
        throw itemError
      }
    }

    // Return the latest published item
    return new Response(
      JSON.stringify({
        success: true,
        campaign: {
          id: campaign.id,
          name: campaign.name
        },
        ads: generateAdHtml({
          title: latestItem.headline,
          description: latestItem.description,
          campaignId: campaign.id,
          creativeId: latestItem.id,
          image_url: latestItem.image_url,
          click_url: latestItem.link,
          cta: latestItem.cta
        }),
        item: {
          id: latestItem.id,
          headline: latestItem.headline,
          clickbait: latestItem.clickbait,
          link: latestItem.link,
          relevance_score: latestItem.relevance_score,
          trend: latestItem.trend,
          description: latestItem.description,
          tooltip: latestItem.tooltip,
          ad_placement: latestItem.ad_placement,
          tags: latestItem.tags,
          created_at: latestItem.created_at,
          updated_at: latestItem.updated_at
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in get-latest-item function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})