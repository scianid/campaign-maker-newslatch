# Get Latest Item API

This Edge Function returns the latest published AI-generated item for a specific campaign.

## Authentication

Uses static token authentication via:
- `Authorization: Bearer <token>` header, OR  
- `X-API-Key: <token>` header

Set the `STATIC_API_TOKEN` environment variable in your Supabase project.

## Endpoint

```
GET /functions/v1/get-latest-item?campaign_id={campaign_id}
```

## Parameters

- `campaign_id` (required): UUID of the campaign

## Example Request

```bash
curl -X GET \
  'https://your-project.supabase.co/functions/v1/get-latest-item?campaign_id=123e4567-e89b-12d3-a456-426614174000' \
  -H 'Authorization: Bearer your-static-token'
```

## Example Response

### Success (200)
```json
{
  "success": true,
  "campaign": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "My Campaign"
  },
  "item": {
    "id": "456e7890-e89b-12d3-a456-426614174001", 
    "headline": "Breaking News Title",
    "clickbait": "You Won't Believe What Happened Next!",
    "link": "https://example.com/article",
    "relevance_score": 85,
    "trend": "trending",
    "description": "Article description...",
    "tooltip": "Additional context...",
    "ad_placement": "top",
    "created_at": "2025-09-28T10:00:00Z",
    "updated_at": "2025-09-28T10:00:00Z"
  }
}
```

### No Published Items (404)
```json
{
  "error": "No published items found for this campaign",
  "campaign": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "My Campaign"
  }
}
```

### Campaign Not Found (404)
```json
{
  "error": "Campaign not found"
}
```

### Unauthorized (401)
```json
{
  "error": "Unauthorized: Invalid API token"
}
```

### Missing Parameters (400)
```json
{
  "error": "Missing campaign_id parameter"
}
```