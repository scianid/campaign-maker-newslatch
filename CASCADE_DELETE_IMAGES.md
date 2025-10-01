# Cascade Delete Images Feature

## Overview

When a landing page is deleted, all associated images stored in the `public-files` bucket are automatically deleted as well. This prevents orphaned files and keeps storage clean.

## Implementation

### Database Trigger (Automatic)

**Migration**: `20251001_cascade_delete_images.sql`

A PostgreSQL trigger automatically deletes all images when a landing page is deleted:

```sql
CREATE TRIGGER trigger_delete_landing_page_images
  BEFORE DELETE ON landing_pages
  FOR EACH ROW
  EXECUTE FUNCTION delete_landing_page_images();
```

**How it works:**
1. User deletes a landing page from the UI
2. DELETE query runs on `landing_pages` table
3. BEFORE DELETE trigger fires
4. Function finds all files matching pattern: `user_id/landing_page_id/*`
5. Deletes all matching files from `storage.objects`
6. Landing page row is deleted

### Benefits

✅ **Automatic**: No manual cleanup required
✅ **Consistent**: Always runs, even if deleted via SQL
✅ **Efficient**: Single database operation handles both table and storage
✅ **Safe**: Only deletes files owned by the user
✅ **Clean**: Prevents orphaned files

### Alternative: Edge Function (Optional)

**Function**: `delete-landing-page-images`

An Edge Function is also available for manual cleanup or batch operations:

```javascript
const response = await fetch(
  'https://your-project.supabase.co/functions/v1/delete-landing-page-images',
  {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      landing_page_id: 'uuid-here'
    })
  }
);
```

## Deployment

### 1. Apply Migration (Required)

```powershell
# Via Supabase Dashboard SQL Editor
# Copy and paste contents of: 20251001_cascade_delete_images.sql
```

Or via CLI:
```powershell
npx supabase db push
```

### 2. Deploy Edge Function (Optional)

```powershell
npx supabase functions deploy delete-landing-page-images
```

## Testing

### Test the Trigger

1. Create a landing page with images
2. Generate some images for sections
3. Delete the landing page from the UI
4. Check the storage bucket - images should be gone

### Verify in Database

```sql
-- Check if trigger exists
SELECT tgname, tgrelid::regclass, tgfoid::regproc
FROM pg_trigger
WHERE tgname = 'trigger_delete_landing_page_images';

-- Check if function exists
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'delete_landing_page_images';
```

## Storage Path Pattern

Images are deleted using this pattern:
```
public-files/
  {user_id}/
    {landing_page_id}/
      * (all files deleted)
```

## Security

- ✅ Trigger runs with `SECURITY DEFINER` to bypass RLS
- ✅ Only deletes files in the user's own folder
- ✅ Verifies user_id from campaign ownership chain
- ✅ Logs all deletions for auditing

## Rollback

If you need to disable cascade deletion:

```sql
DROP TRIGGER IF EXISTS trigger_delete_landing_page_images ON landing_pages;
```

To re-enable:
```sql
CREATE TRIGGER trigger_delete_landing_page_images
  BEFORE DELETE ON landing_pages
  FOR EACH ROW
  EXECUTE FUNCTION delete_landing_page_images();
```

## Files Modified

✅ New Migration: `supabase/migrations/20251001_cascade_delete_images.sql`
✅ New Edge Function: `supabase/functions/delete-landing-page-images/` (optional)
✅ Updated Component: `src/components/LandingPagesPage.jsx`

## Notes

- The trigger handles deletion automatically
- No changes needed in the frontend (trigger does the work)
- Edge Function is provided for manual/batch operations
- All deletions are logged in PostgreSQL logs
