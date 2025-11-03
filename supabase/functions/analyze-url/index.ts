import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Import shared utilities
import { authenticateUser, createAuthenticatedClient } from '../rss-feeds/auth.ts';
import { checkUserCredits, deductUserCredit } from '../rss-feeds/credits.ts';

const ANALYZE_API_BASE_URL = "http://109.199.126.145";

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    // Create authenticated Supabase client
    const supabaseClient = createAuthenticatedClient(req, createClient);

    // Verify user authentication
    const authResult = await authenticateUser(supabaseClient);
    if (!authResult.success) {
      return new Response(
        JSON.stringify({ error: authResult.error || 'Authentication failed' }),
        { 
          status: 401,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    }

    const userId = authResult.user!.id;

    // Check if user has credits before processing
    console.log('💳 Checking user credits...');
    const creditCheck = await checkUserCredits(supabaseClient, userId);
    
    if (!creditCheck.hasCredits) {
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient credits',
          message: `You need credits to analyze URLs. Current credits: ${creditCheck.currentCredits}`
        }),
        { 
          status: 402,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    }

    console.log(`✅ User has ${creditCheck.currentCredits} credits available`);

    const apiKey = Deno.env.get("ANALYZE_API_KEY");
    if (!apiKey) {
      console.error("ANALYZE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Parse request body
    const { url } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid URL format" }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    console.log(`Submitting analysis request for URL: ${url}`);

    // Forward request to the analyze API
    const response = await fetch(`${ANALYZE_API_BASE_URL}/api/v1/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({ url }),
    });

    // Get response data
    const data = await response.json();

    if (!response.ok) {
      console.error(`Analyze API error: ${response.status}`, data);
      return new Response(
        JSON.stringify({ 
          error: data.error || "Failed to submit analysis request",
          details: data
        }),
        { 
          status: response.status,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    console.log(`Analysis job created:`, data);

    // Deduct credit after successful API call
    console.log('💳 Deducting credit for URL analysis...');
    const deductResult = await deductUserCredit(supabaseClient, userId);
    
    if (!deductResult.success) {
      console.error('⚠️ Failed to deduct credit, but analysis was successful');
      // Continue anyway since analysis was already performed
    } else {
      console.log(`✅ Credit deducted. Remaining credits: ${deductResult.remainingCredits}`);
    }

    // Return the job details
    return new Response(
      JSON.stringify({
        ...data,
        credits_remaining: deductResult.remainingCredits
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );

  } catch (error) {
    console.error("Error in analyze-url function:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
});
