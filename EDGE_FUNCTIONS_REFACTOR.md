# Edge Functions Refactoring Summary

## Overview
Refactored edge functions to use shared utilities from `rss-feeds/ai.ts` for consistency and maintainability.

## Changes Made

### 1. `generate-paragraph` Function
**File**: `supabase/functions/generate-paragraph/index.ts`

**Updated to use:**
- ✅ `runGpt()` from `../rss-feeds/ai.ts`
- ✅ `authenticateUser()` and `createAuthenticatedClient()` for auth
- ✅ `handleCors()`, `createErrorResponse()`, `createSuccessResponse()` for HTTP handling

**Implementation:**
```typescript
// Import shared utilities
import { runGpt } from '../rss-feeds/ai.ts';
import { authenticateUser, createAuthenticatedClient } from '../rss-feeds/auth.ts';
import { handleCors, createErrorResponse, createSuccessResponse } from '../rss-feeds/http-utils.ts';

// Call AI with JSON response format
const gptResponse = await runGpt(aiPrompt);

// Parse JSON response
const parsedResponse = JSON.parse(gptResponse);
const generatedParagraph = parsedResponse.paragraph?.trim() || '';
```

**Prompt Structure:**
- Instructs AI to return JSON: `{ "paragraph": "..." }`
- `runGpt()` uses `response_format: { type: "json_object" }`
- Proper error handling for JSON parsing failures

---

### 2. `generate-landing-page` Function
**File**: `supabase/functions/generate-landing-page/index.ts`

**Updated to use:**
- ✅ `runGpt()` from `../rss-feeds/ai.ts`
- ✅ Already using `authenticateUser()`, `createAuthenticatedClient()` 
- ✅ Already using `handleCors()`, `createErrorResponse()`, `createSuccessResponse()`

**Removed:**
- ❌ Custom `callOpenAI()` function (replaced with `runGpt()`)

**Implementation:**
```typescript
// Import shared utilities
import { runGpt } from '../rss-feeds/ai.ts';

// Call AI with JSON response format
const openaiResponse = await runGpt(prompt);

// Parse JSON response
const landingPageData = JSON.parse(openaiResponse);
```

**Prompt Structure:**
- Instructs AI to return JSON:
```json
{
  "title": "The overall article title",
  "sections": [
    {
      "subtitle": "Section subtitle",
      "paragraphs": ["paragraph 1", "paragraph 2"],
      "image_prompt": "Image description",
      "cta": "Call to action"
    }
  ]
}
```

---

## Benefits of Refactoring

### 1. **Code Reusability**
- Single source of truth for OpenAI API calls
- Shared authentication and HTTP utilities
- Reduces code duplication

### 2. **Consistency**
- All edge functions use the same patterns
- Standardized error handling
- Consistent logging format

### 3. **Maintainability**
- Changes to `runGpt()` benefit all functions
- Easier to update OpenAI model version
- Centralized API key management

### 4. **Error Handling**
- Robust error handling in `runGpt()`
- Standardized error responses
- Better debugging with consistent logging

### 5. **JSON Response Format**
- `runGpt()` enforces JSON output via `response_format: { type: "json_object" }`
- More reliable parsing
- Reduced risk of malformed responses

---

## Shared Utilities Used

### From `rss-feeds/ai.ts`:
```typescript
export async function runGpt(prompt: string): Promise<string>
```
- Calls OpenAI API with `gpt-5-mini` model
- Forces JSON response format
- Includes error handling and logging
- Returns stringified JSON

### From `rss-feeds/auth.ts`:
```typescript
export async function authenticateUser(supabase: SupabaseClient)
export function createAuthenticatedClient(req: Request, createClient: Function)
```
- User authentication
- Authenticated Supabase client creation

### From `rss-feeds/http-utils.ts`:
```typescript
export function handleCors(): Response
export function createErrorResponse(error: string, details: string, status: number): Response
export function createSuccessResponse(data: any): Response
export function getUrlParams(req: Request): URLSearchParams
export function validateRequiredParams(params: URLSearchParams, required: string[]): ValidationResult
```
- CORS handling
- Standardized response formats
- URL parameter utilities

---

## OpenAI Configuration

Both functions now use:
- **Model**: `gpt-5-mini` (via `runGpt()`)
- **Response Format**: `json_object` (enforced)
- **Temperature**: Default (via `runGpt()`)
- **Max Tokens**: Default (via `runGpt()`)

To customize per-function if needed, you can:
1. Update `runGpt()` to accept options parameter
2. Or create function-specific wrappers

---

## Testing Checklist

### `generate-paragraph`:
- [ ] Test with all 10 content types
- [ ] Verify JSON parsing works
- [ ] Test error handling (invalid prompt, API errors)
- [ ] Verify paragraph quality and length
- [ ] Test with different landing pages

### `generate-landing-page`:
- [ ] Test with various AI items
- [ ] Verify JSON structure validation
- [ ] Test section generation (3-5 sections)
- [ ] Verify image prompts are generated
- [ ] Test CTA generation
- [ ] Verify database insertion

---

## Future Improvements

### Potential Enhancements:
1. **Add caching** - Cache AI responses for identical prompts
2. **Retry logic** - Retry failed API calls with exponential backoff
3. **Token tracking** - Log token usage for cost monitoring
4. **A/B testing** - Generate multiple variants for testing
5. **Streaming** - Support streaming responses for real-time feedback
6. **Custom models** - Allow per-function model selection
7. **Rate limiting** - Implement rate limiting for AI calls

### Configuration Options:
Consider adding to `runGpt()`:
```typescript
interface GptOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export async function runGpt(prompt: string, options?: GptOptions): Promise<string>
```

---

## Deployment Notes

1. **No changes required** to environment variables
2. **Existing `OPENAI_API_KEY`** is used by all functions
3. **Deploy order doesn't matter** - all functions are independent
4. **No database migrations** needed

### Deployment Command:
```bash
# Deploy individual functions
supabase functions deploy generate-paragraph
supabase functions deploy generate-landing-page

# Or deploy all at once
supabase functions deploy
```

---

## Monitoring

### Key Metrics to Track:
- ✅ OpenAI API response time
- ✅ JSON parsing success rate
- ✅ Error rates per function
- ✅ Token usage and costs
- ✅ User satisfaction with generated content

### Logging:
Both functions now include consistent logging:
- 🔑 API Key availability check
- 📝 Prompt length logging
- 🚀 API request initiation
- 📡 API response status
- 📦 Response content preview
- ✅ Success confirmations
- ❌ Error details

---

## Summary

Both `generate-paragraph` and `generate-landing-page` edge functions have been successfully refactored to use the shared `runGpt()` utility from `rss-feeds/ai.ts`. This provides:

- **Consistency** across all edge functions
- **Maintainability** through code reusability
- **Reliability** with robust error handling
- **Scalability** for future enhancements

All functions now follow the same architectural pattern, making the codebase easier to understand, maintain, and extend.
