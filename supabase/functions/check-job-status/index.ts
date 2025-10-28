import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ANALYZE_API_BASE_URL = "http://109.199.126.145";

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
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

    // Get jobId from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const jobId = pathParts[pathParts.length - 1];
    
    if (!jobId) {
      return new Response(
        JSON.stringify({ error: "Job ID is required" }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    console.log(`Checking status for job: ${jobId}`);

    // Forward request to the analyze API
    const response = await fetch(
      `${ANALYZE_API_BASE_URL}/api/v1/analyze/status/${jobId}`,
      {
        method: "GET",
        headers: {
          "X-API-Key": apiKey,
        },
      }
    );

    // Get response data
    const data = await response.json();

    if (!response.ok) {
      console.error(`Analyze API error: ${response.status}`, data);
      return new Response(
        JSON.stringify({ 
          error: data.error || "Failed to check job status",
          details: data
        }),
        { 
          status: response.status,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    console.log(`Job status:`, data);

    // Return the job status
    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );

  } catch (error) {
    console.error("Error in check-job-status function:", error);
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
