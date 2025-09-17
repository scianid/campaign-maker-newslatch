// Authentication utilities for edge functions

export interface AuthResult {
  success: boolean;
  user?: any;
  error?: string;
}

/**
 * Verify user authentication and return user data
 */
export async function authenticateUser(supabaseClient: any): Promise<AuthResult> {
  try {
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized. Please log in.'
      };
    }

    return {
      success: true,
      user
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: 'Authentication failed'
    };
  }
}

/**
 * Create authenticated Supabase client from request
 */
export function createAuthenticatedClient(req: Request, createClient: any): any {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    }
  );
  
  return supabaseClient;
}