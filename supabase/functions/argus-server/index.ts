import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const TARGET_URL = "http://34.165.46.113:8080";

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
      },
    });
  }

  try {
    // Get the request URL to extract the path and query parameters
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/argus-server/, ''); // Remove /argus-server prefix
    const queryString = url.search;
    
    // Construct the target URL
    const targetUrl = `${TARGET_URL}${path}${queryString}`;
    
    console.log(`Proxying ${req.method} request to: ${targetUrl}`);

    // Forward the request headers (excluding host and some internal headers)
    const headers = new Headers();
    req.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey !== 'host' &&
        lowerKey !== 'connection' &&
        !lowerKey.startsWith('x-forwarded-') &&
        !lowerKey.startsWith('cf-')
      ) {
        headers.set(key, value);
      }
    });

    // Forward the request body for methods that support it
    let body = null;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      body = await req.arrayBuffer();
    }

    // Make the proxied request
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: body ? new Uint8Array(body) : null,
    });

    // Get response headers
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      responseHeaders.set(key, value);
    });
    
    // Add CORS headers
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    responseHeaders.set("Access-Control-Allow-Headers", "authorization, x-client-info, apikey, content-type, x-api-key");

    // Get response body
    const responseBody = await response.arrayBuffer();

    // Return the proxied response
    return new Response(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error("Proxy error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Proxy error",
        message: error instanceof Error ? error.message : "Unknown error"
      }),
      { 
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
  }
});
