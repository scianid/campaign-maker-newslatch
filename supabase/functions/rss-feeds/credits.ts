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

    // Create a service role client to bypass RLS
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: profile, error } = await serviceClient
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

    if (!profile) {
      console.error('❌ Profile not found for user:', userId);
      return {
        hasCredits: false,
        currentCredits: 0,
        error: 'User profile not found'
      };
    }

    const credits = profile.credits || 0;
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
    console.log('💳 Deducting 1 credit from user:', userId);

    // First check if user has credits
    const creditCheck = await checkUserCredits(supabaseClient, userId);
    
    if (!creditCheck.hasCredits) {
      console.warn('⚠️ User has no credits available');
      return {
        success: false,
        remainingCredits: creditCheck.currentCredits,
        error: 'Insufficient credits'
      };
    }

    // Create a service role client to bypass RLS
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get current credits
    const { data: currentProfile, error: fetchError } = await serviceClient
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    if (fetchError || !currentProfile) {
      console.error('❌ Error fetching profile for credit deduction:', fetchError);
      return {
        success: false,
        remainingCredits: creditCheck.currentCredits,
        error: 'Failed to fetch profile'
      };
    }

    const newCredits = Math.max((currentProfile.credits || 0) - 1, 0);

    // Update with the new credit value using service role
    const { data, error } = await serviceClient
      .from('profiles')
      .update({ 
        credits: newCredits,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('credits')
      .single();

    if (error) {
      console.error('❌ Error deducting credit:', error);
      return {
        success: false,
        remainingCredits: creditCheck.currentCredits,
        error: 'Failed to deduct credit'
      };
    }

    if (!data) {
      console.warn('⚠️ No data returned after credit deduction');
      return {
        success: false,
        remainingCredits: 0,
        error: 'Credit deduction failed'
      };
    }

    const remainingCredits = data.credits || 0;
    console.log(`✅ Credit deducted. Remaining credits: ${remainingCredits}`);

    return {
      success: true,
      remainingCredits
    };

  } catch (error) {
    console.error('❌ Exception deducting credit:', error);
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
