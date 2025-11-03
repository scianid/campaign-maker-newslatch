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
    return `You have run out of AI credits. Please contact support to purchase more credits or upgrade your plan.`;
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
  
  const message = typeof error === 'string' ? error : error?.message || '';
  
  // Check for credit-related errors
  if (isInsufficientCreditsError(message)) {
    return getCreditErrorMessage(message);
  }
  
  // Return the actual error message or default
  return message || defaultMessage;
}
