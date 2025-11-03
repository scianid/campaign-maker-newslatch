// Credit management utilities for AI operations

export interface CreditCheckResult {
  hasCredits: boolean;
  currentCredits: number;
  error?: string;
}

export interface CreditDeductResult {
  success: boolean;
  remainingCredits: number;
  error?: string;
}

/**
 * Check if user has available credits
 * @param supabaseClient - Authenticated Supabase client
 * @param userId - User ID to check credits for
 * @returns CreditCheckResult with current credit status
 */
export async function checkUserCredits(
  supabaseClient: any,
  userId: string
): Promise<CreditCheckResult> {
  try {
    console.log('💳 Checking credits for user:', userId);

    const { data: profile, error } = await supabaseClient
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ Error checking credits:', error);
      return {
        hasCredits: false,
        currentCredits: 0,
        error: 'Failed to check user credits'
      };
    }

    const credits = profile?.credits || 0;
    console.log(`💰 User has ${credits} credits`);

    return {
      hasCredits: credits > 0,
      currentCredits: credits
    };

  } catch (error) {
    console.error('❌ Exception checking credits:', error);
    return {
      hasCredits: false,
      currentCredits: 0,
      error: error instanceof Error ? error.message : 'Unknown error checking credits'
    };
  }
}

/**
 * Deduct one credit from user's account
 * @param supabaseClient - Authenticated Supabase client
 * @param userId - User ID to deduct credit from
 * @returns CreditDeductResult with updated credit status
 */
export async function deductUserCredit(
  supabaseClient: any,
  userId: string
): Promise<CreditDeductResult> {
  try {
    console.log('💳 [STEP 1] Starting credit deduction for user:', userId);

    // Create service role client to bypass RLS
    console.log('💳 [STEP 2] Creating service role client...');
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    console.log('💳 [STEP 2.1] Service role key available:', !!supabaseServiceKey, 'length:', supabaseServiceKey.length);
    console.log('💳 [STEP 2.2] Supabase URL:', supabaseUrl);
    
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    console.log('💳 [STEP 2.3] Service client created successfully');

    // First get current credits
    console.log('💳 [STEP 3] Fetching current credits from profiles table...');
    const { data: profile, error: fetchError } = await serviceClient
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    console.log('💳 [STEP 4] Fetch result:', { 
      hasData: !!profile, 
      hasError: !!fetchError,
      credits: profile?.credits 
    });

    if (fetchError) {
      console.error('❌ [STEP 4 ERROR] Error fetching credits:', JSON.stringify(fetchError));
      return {
        success: false,
        remainingCredits: 0,
        error: 'Failed to fetch credits'
      };
    }

    const currentCredits = profile?.credits || 0;
    const newCredits = Math.max(currentCredits - 1, 0);
    
    console.log('💳 [STEP 5] Calculated new credits:', { 
      currentCredits, 
      newCredits,
      userId 
    });

    // Direct update using service role to bypass RLS
    console.log('💳 [STEP 6] Executing UPDATE query with service role...');
    const { error: updateError } = await serviceClient
      .from('profiles')
      .update({ credits: newCredits })
      .eq('id', userId);

    console.log('💳 [STEP 7] Update result:', { 
      hasError: !!updateError,
      errorDetails: updateError ? JSON.stringify(updateError) : 'none'
    });

    if (updateError) {
      console.error('❌ [STEP 7 ERROR] Error deducting credit:', JSON.stringify(updateError));
      return {
        success: false,
        remainingCredits: currentCredits,
        error: 'Failed to deduct credit'
      };
    }

    console.log(`✅ [STEP 8 SUCCESS] Credit deducted. Remaining credits: ${newCredits}`);

    return {
      success: true,
      remainingCredits: newCredits
    };

  } catch (error) {
    console.error('❌ [EXCEPTION] Exception deducting credit:', error);
    console.error('❌ [EXCEPTION] Stack trace:', error instanceof Error ? error.stack : 'N/A');
    return {
      success: false,
      remainingCredits: 0,
      error: error instanceof Error ? error.message : 'Unknown error deducting credit'
    };
  }
}

/**
 * Custom error class for credit-related errors
 */
export class InsufficientCreditsError extends Error {
  currentCredits: number;
  
  constructor(currentCredits: number) {
    super(`Insufficient credits. You have ${currentCredits} credits remaining.`);
    this.name = 'InsufficientCreditsError';
    this.currentCredits = currentCredits;
  }
}
