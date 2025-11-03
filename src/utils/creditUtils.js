// Credit-related utilities for frontend

/**
 * Check if error is related to insufficient credits
 * @param {Error|string} error - The error object or message
 * @returns {boolean} - True if error is credit-related
 */
export function isInsufficientCreditsError(error) {
  const message = typeof error === 'string' ? error : error?.message || '';
  return message.toLowerCase().includes('insufficient credits') || 
         message.toLowerCase().includes('credit');
}

/**
 * Extract user-friendly credit error message
 * @param {Error|string} error - The error object or message
 * @returns {string} - Formatted error message
 */
export function getCreditErrorMessage(error) {
  const message = typeof error === 'string' ? error : error?.message || '';
  
  if (isInsufficientCreditsError(error)) {
    return `No credits. Please contact support to purchase more credits or upgrade your plan.`;
  }
  
  return message;
}

/**
 * Handle edge function errors with special handling for credit errors
 * @param {Error|string} error - The error from edge function
 * @param {string} defaultMessage - Default message if not credit-related
 * @returns {string} - User-friendly error message
 */
export function handleEdgeFunctionError(error, defaultMessage = 'An error occurred') {
  console.error('Edge function error:', error);
  console.error('Error structure:', JSON.stringify(error, null, 2));
  
  // Try to extract the actual error message from the response
  let message = '';
  
  // Check various possible error structures
  if (error?.context?.body) {
    // Supabase wraps the response in error.context.body
    try {
      const body = typeof error.context.body === 'string' 
        ? JSON.parse(error.context.body) 
        : error.context.body;
      message = body.message || body.error || '';
      console.log('Extracted from context.body:', message);
    } catch (e) {
      // If parsing fails, try to use it as-is
      message = error.context.body;
    }
  } else if (error?.body) {
    // Try error.body directly
    try {
      const body = typeof error.body === 'string' ? JSON.parse(error.body) : error.body;
      message = body.message || body.error || '';
      console.log('Extracted from body:', message);
    } catch (e) {
      message = error.body;
    }
  } else if (error?.message) {
    // Fallback to error.message
    message = error.message;
    console.log('Using error.message:', message);
  } else if (typeof error === 'string') {
    // If error is just a string
    message = error;
  }
  
  // Check for credit-related errors
  if (isInsufficientCreditsError(message)) {
    return getCreditErrorMessage(message);
  }
  
  // Return the actual error message or default
  return message || defaultMessage;
}
