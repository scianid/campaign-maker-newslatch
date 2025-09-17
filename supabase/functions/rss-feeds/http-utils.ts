// HTTP utilities and response helpers

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Handle CORS preflight requests
 */
export function handleCors(): Response {
  return new Response('ok', { headers: corsHeaders });
}

/**
 * Create success response
 */
export function createSuccessResponse(data: any, status: number = 200): Response {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Create error response
 */
export function createErrorResponse(
  error: string, 
  details?: string, 
  status: number = 500
): Response {
  return new Response(
    JSON.stringify({ 
      success: false, 
      error, 
      details 
    }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Extract URL parameters from request
 */
export function getUrlParams(req: Request): URLSearchParams {
  const url = new URL(req.url);
  return url.searchParams;
}

/**
 * Validate required parameters
 */
export function validateRequiredParams(
  params: URLSearchParams, 
  required: string[]
): { valid: boolean; missing?: string[] } {
  const missing = required.filter(param => !params.get(param));
  
  if (missing.length > 0) {
    return { valid: false, missing };
  }
  
  return { valid: true };
}