# Async Campaign Analysis System

## Overview

This system replaces the synchronous AI campaign suggestions with an asynchronous job-based approach using a dedicated analysis API. The campaign creation process now submits a URL for analysis, polls for completion, and then uses the results.

## Architecture

### Database Changes

Added to `campaigns` table:
- `job_id` (TEXT): Unique identifier for the analysis job
- `job_status` (TEXT): Current status (QUEUED, PROCESSING, COMPLETED, FAILED)
- `job_submitted_at` (TIMESTAMPTZ): When the job was submitted
- `job_completed_at` (TIMESTAMPTZ): When the job completed

### Edge Functions

#### 1. `analyze-url`
**Purpose**: Submit a URL for analysis (reverse proxy to external API)

**Endpoint**: `/functions/v1/analyze-url`

**Method**: POST

**Request Body**:
```json
{
  "url": "https://example.com"
}
```

**Response**:
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "QUEUED",
  "statusUrl": "/api/v1/analyze/status/550e8400-e29b-41d4-a716-446655440000",
  "submittedAt": "2025-10-23T20:30:00"
}
```

**Environment Variable**: `ANALYZE_API_KEY` - API key for the external analysis service

#### 2. `check-job-status`
**Purpose**: Check the status of an analysis job

**Endpoint**: `/functions/v1/check-job-status/{jobId}`

**Method**: GET

**Response**:
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "COMPLETED",
  "currentStep": "Completed",
  "progressMessage": "Analysis completed successfully",
  "submittedAt": "2025-10-23T20:30:00",
  "startedAt": "2025-10-23T20:30:01",
  "completedAt": "2025-10-23T20:32:15",
  "result": {
    "suggestedTags": ["project-management", "saas", "team-collaboration"],
    "suggestedDescription": "Company description here...",
    "productDescription": "Product description here...",
    "targetAudience": "Target audience here...",
    "metadata": {
      "strategy": "MAP_REDUCE",
      "chunksAnalyzed": 5,
      "confidenceScore": 0.91
    }
  },
  "error": null
}
```

**Possible statuses**: QUEUED, PROCESSING, COMPLETED, FAILED

**Progress Response (PROCESSING)**:
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "PROCESSING",
  "currentStep": "Map-Reduce",
  "progressMessage": "Processing chunk 3 of 5",
  "submittedAt": "2025-10-23T20:30:00",
  "startedAt": "2025-10-23T20:30:01",
  "result": null,
  "error": null
}
```

**Environment Variable**: `ANALYZE_API_KEY`

### External API

**Base URL**: `http://109.199.126.145/`

**Authentication**: X-API-Key header

**Endpoints**:
- `POST /api/v1/analyze` - Submit URL for analysis
- `GET /api/v1/analyze/status/{jobId}` - Check job status

## Campaign Creation Flow

1. **User enters campaign URL** (Step 1)
2. **User moves to Step 2** - triggers analysis:
   - Call `campaignService.submitAnalysisJob(url)`
   - Receives `jobId` and initial status
   - Stores `jobId` and `jobStatus` in form state
3. **Poll for completion**:
   - Every 3 seconds, call `campaignService.checkJobStatus(jobId)`
   - Update UI with current status
   - Continue up to 60 attempts (3 minutes)
4. **When COMPLETED**:
   - Extract results (tags, descriptions, etc.)
   - Populate AI suggestions in form
   - User can edit or proceed
5. **User completes form** (Step 3)
6. **Create campaign**:
   - Save campaign with all data including `job_id` and `job_status`

## Campaign Service Methods

### `submitAnalysisJob(url)`
Submits a URL for analysis and returns job details.

**Parameters**:
- `url` (string): The URL to analyze

**Returns**: Promise<{ jobId, status, statusUrl, submittedAt }>

### `checkJobStatus(jobId)`
Checks the current status of an analysis job.

**Parameters**:
- `jobId` (string): The job identifier

**Returns**: Promise<{ jobId, status, result?, completedAt? }>

### `updateCampaignJobStatus(id, status, completedAt?)`
Updates the job status for a campaign.

**Parameters**:
- `id` (string): Campaign ID
- `status` (string): New job status
- `completedAt` (string, optional): Completion timestamp

**Returns**: Promise<Campaign>

## Configuration

### Setting up the API Key

1. Go to Supabase Dashboard → Edge Functions → Secrets
2. Add a new secret:
   - Name: `ANALYZE_API_KEY`
   - Value: Your API key from the analysis service

### Deploying Edge Functions

```bash
# Deploy analyze-url function
supabase functions deploy analyze-url

# Deploy check-job-status function
supabase functions deploy check-job-status
```

### Running the Migration

```bash
# Apply the database migration
supabase db push
```

## Error Handling

- **Job submission fails**: User is alerted and can continue manually
- **Job times out** (after 3 minutes): User is alerted and can continue manually
- **Job fails**: User is alerted and can continue manually
- **Network errors during polling**: Polling stops, user is alerted

## Future Enhancements

1. **Webhook support**: Instead of polling, receive a webhook when job completes
2. **Retry logic**: Automatically retry failed jobs
3. **Progress indicators**: More detailed status updates during processing
4. **Background processing**: Process results in background and notify user
5. **Job history**: Track all analysis jobs per campaign
