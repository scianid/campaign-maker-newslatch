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

    // Deduct one credit using PostgreSQL to ensure atomicity
    const { data, error } = await supabaseClient
      .from('profiles')
      .update({ 
        credits: supabaseClient.raw('credits - 1'),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .gt('credits', 0) // Only update if credits > 0
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
      // This can happen if the credit was consumed between check and deduct
      console.warn('⚠️ Race condition: credit was consumed before deduction');
      return {
        success: false,
        remainingCredits: 0,
        error: 'Credit already consumed'
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
