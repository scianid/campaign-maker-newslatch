# Scheduled Updates Edge Function

This edge function processes scheduled content updates for campaigns that have `get_updates` enabled.

## How It Works

1. Accepts a GET request with API key authentication
2. Takes a `user_id` query parameter
3. Finds the first campaign for that user where `get_updates = true` (ordered by creation date)
4. Checks if the current UTC hour matches the campaign's `updates_hour` setting
5. Calls the `ai-generate` function to generate new AI content for that campaign
6. Returns the result

## Authentication

This endpoint uses API key authentication instead of JWT tokens to allow scheduled/automated access.

### Required Secret
Set the `SCHEDULER_API_KEY` secret in your Supabase project:

```bash
supabase secrets set SCHEDULER_API_KEY=your-secure-random-api-key-here
```

## Usage

### API Endpoint
```
GET /functions/v1/scheduled-updates?user_id={user_id}
```

### Headers
```
x-api-key: <your-scheduler-api-key>
```

### Query Parameters
- `user_id` (required): The UUID of the user whose campaigns to process
- `force_update` (optional): Set to `true` to bypass the schedule time check and force update immediately

### Example Request
```bash
# Normal request (respects schedule)
curl -X GET \
  "https://your-project.supabase.co/functions/v1/scheduled-updates?user_id=uuid-here" \
  -H "x-api-key: your-scheduler-api-key"

# Force update (bypasses schedule check)
curl -X GET \
  "https://your-project.supabase.co/functions/v1/scheduled-updates?user_id=uuid-here&force_update=true" \
  -H "x-api-key: your-scheduler-api-key"
```

### Response (Success)
```json
{
  "message": "Scheduled update completed successfully",
  "campaign_id": "uuid",
  "campaign_name": "Campaign Name",
  "processed": true,
  "ai_result": {
    "items_generated": 5,
    "items_with_images": 3,
    ...
  }
}
```

### Response (No Updates Needed)
```json
{
  "message": "No campaigns with updates enabled",
  "processed": false
}
```

or

```json
{
  "message": "Not the scheduled time for updates",
  "campaign_id": "uuid",
  "campaign_name": "Campaign Name",
  "scheduled_hour": 8,
  "current_hour": 10,
  "processed": false
}
```

## Deployment

Deploy using Supabase CLI:
```bash
supabase functions deploy scheduled-updates
```

## Scheduling with Cron

You can set up this function to run on a schedule using:

1. **Supabase Cron** (if available)
2. **External cron service** (like GitHub Actions, AWS EventBridge, etc.)
3. **Third-party services** (like Cron-job.org, EasyCron, etc.)

Example GitHub Actions workflow:
```yaml
name: Scheduled Campaign Updates
on:
  schedule:
    - cron: '0 * * * *'  # Every hour
jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - name: Call scheduled-updates for each user
        run: |
          # You'll need to maintain a list of user IDs or query them from your system
          for USER_ID in ${{ secrets.USER_IDS }}; do
            curl -X GET \
              "https://your-project.supabase.co/functions/v1/scheduled-updates?user_id=$USER_ID" \
              -H "x-api-key: ${{ secrets.SCHEDULER_API_KEY }}"
          done
```

## Features

- ✅ Finds campaigns with updates enabled
- ✅ Checks scheduled update time (optional)
- ✅ Calls ai-generate function automatically
- ✅ Returns detailed results
- ✅ Handles authentication and errors
- ✅ Orders campaigns by creation date (oldest first)

## Notes

- Only processes ONE campaign per execution (the first one found)
- The hour check compares against UTC time
- Requires the user to have sufficient credits for AI generation
- The campaign must have RSS categories and feeds configured
