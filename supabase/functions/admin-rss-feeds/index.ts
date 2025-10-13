import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the current user and check if they're admin
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.is_admin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const url = new URL(req.url)
    const method = req.method

    // Handle different HTTP methods and operations
    switch (method) {
      case 'GET':
        return await handleGetRssFeeds(supabaseClient)
      
      case 'POST':
        return await handleCreateRssFeed(supabaseClient, req)
      
      case 'PUT':
        return await handleUpdateRssFeed(supabaseClient, req, url)
      
      case 'DELETE':
        return await handleDeleteRssFeed(supabaseClient, url)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { 
            status: 405, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Get all RSS feeds (including inactive ones for admin)
async function handleGetRssFeeds(supabaseClient: any) {
  const { data, error } = await supabaseClient
    .from('rss_feeds')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  return new Response(
    JSON.stringify({ data }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

// Create a new RSS feed
async function handleCreateRssFeed(supabaseClient: any, req: Request) {
  const body = await req.json()
  const { name, url, categories, countries, is_active = true } = body

  if (!name || !url) {
    return new Response(
      JSON.stringify({ error: 'Name and URL are required' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  const { data, error } = await supabaseClient
    .from('rss_feeds')
    .insert([{
      name,
      url,
      categories: categories || [],
      country: countries || [],
      is_active
    }])
    .select()

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  return new Response(
    JSON.stringify({ data: data[0] }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

// Update an RSS feed
async function handleUpdateRssFeed(supabaseClient: any, req: Request, url: URL) {
  const feedId = url.searchParams.get('id')
  
  if (!feedId) {
    return new Response(
      JSON.stringify({ error: 'Feed ID is required' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  const body = await req.json()
  const { name, url: feedUrl, categories, countries, is_active } = body

  const updates: any = {}
  if (name !== undefined) updates.name = name
  if (feedUrl !== undefined) updates.url = feedUrl
  if (categories !== undefined) updates.categories = categories
  if (countries !== undefined) updates.country = countries
  if (is_active !== undefined) updates.is_active = is_active

  const { data, error } = await supabaseClient
    .from('rss_feeds')
    .update(updates)
    .eq('id', feedId)
    .select()

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  if (!data || data.length === 0) {
    return new Response(
      JSON.stringify({ error: 'RSS feed not found' }),
      { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  return new Response(
    JSON.stringify({ data: data[0] }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

// Delete an RSS feed
async function handleDeleteRssFeed(supabaseClient: any, url: URL) {
  const feedId = url.searchParams.get('id')
  
  if (!feedId) {
    return new Response(
      JSON.stringify({ error: 'Feed ID is required' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  const { error } = await supabaseClient
    .from('rss_feeds')
    .delete()
    .eq('id', feedId)

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  return new Response(
    JSON.stringify({ message: 'RSS feed deleted successfully' }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}