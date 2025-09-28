import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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



    const url = new URL(req.url)
    const method = req.method

    // Handle different HTTP methods and operations
    switch (method) {
      case 'GET':
        if (url.pathname.includes('/profile')) {
          return await handleGetCurrentUserProfile(supabaseClient, user)
        }
        // Check if user is admin for listing all users
        if (profileError || !profile?.is_admin) {
          return new Response(
            JSON.stringify({ error: 'Admin access required' }),
            { 
              status: 403, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
        return await handleGetAllUsers(supabaseClient)
      
      case 'PUT':
        // Check if user is admin for updating user admin status
        if (profileError || !profile?.is_admin) {
          return new Response(
            JSON.stringify({ error: 'Admin access required' }),
            { 
              status: 403, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
        return await handleUpdateUserAdmin(supabaseClient, req, url)
      
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

// Get current user profile
async function handleGetCurrentUserProfile(supabaseClient: any, user: any) {
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('id, email, full_name, is_admin, created_at, updated_at')
    .eq('id', user.id)
    .single()

  if (error) {
    // If profile doesn't exist, create it
    if (error.code === 'PGRST116') {
      const { data: newProfile, error: insertError } = await supabaseClient
        .from('profiles')
        .insert([{
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email,
          is_admin: false
        }])
        .select()
        .single()

      if (insertError) {
        return new Response(
          JSON.stringify({ error: 'Failed to create profile' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ data: newProfile }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Failed to get profile' }),
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

// Get all users (admin only)
async function handleGetAllUsers(supabaseClient: any) {
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('id, email, full_name, is_admin, created_at, updated_at')
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

// Update user admin status
async function handleUpdateUserAdmin(supabaseClient: any, req: Request, url: URL) {
  const userId = url.searchParams.get('user_id')
  
  if (!userId) {
    return new Response(
      JSON.stringify({ error: 'User ID is required' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  const body = await req.json()
  const { is_admin } = body

  if (typeof is_admin !== 'boolean') {
    return new Response(
      JSON.stringify({ error: 'is_admin must be a boolean' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  const { data, error } = await supabaseClient
    .from('profiles')
    .update({ is_admin })
    .eq('id', userId)
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
      JSON.stringify({ error: 'User not found' }),
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