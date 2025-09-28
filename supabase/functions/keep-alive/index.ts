import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      }
    });
  }

  try {
    console.log('🔄 Keep-alive function called');

    // Get Supabase credentials from environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Create Supabase client
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    // Execute a simple SELECT 1 query to keep the database connection alive
    // We'll use a basic query that doesn't require authentication
    const { data, error } = await supabaseClient
      .from('campaigns')
      .select('id')
      .limit(1);

    if (error) {
      console.error('❌ Database keep-alive query failed:', error);
      // Still return 200 even if the query fails to indicate the function is alive
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Keep-alive function is running',
          database_status: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
          }
        }
      );
    }

    console.log('✅ Keep-alive query successful');

    // Return 200 status with success message
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Keep-alive function executed successfully',
        database_status: 'connected',
        timestamp: new Date().toISOString(),
        query_result: 'SELECT 1 executed'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
        }
      }
    );

  } catch (error) {
    console.error('❌ Error in keep-alive function:', error);
    
    // Still return 200 even if there's an error to indicate the function is alive
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Keep-alive function is running',
        database_status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
        }
      }
    );
  }
});