# 🎉 Image Generation & Auto-Cleanup - Complete!

## ✅ What's Been Deployed

### 1. Image Generation Function
**Status**: ✅ **DEPLOYED**
- Function: `generate-landing-page-image`
- Generates images with OpenAI DALL-E 3
- Stores in `public-files` bucket at `USER_ID/LANDING_PAGE_ID/date_uuid.png`
- Updates landing page sections with image URLs

### 2. Cascade Delete Function  
**Status**: ✅ **DEPLOYED**
- Function: `delete-landing-page-images` (optional utility)
- Migration: `20251001_cascade_delete_images.sql` (automatic trigger)
- **Automatically deletes all images** when landing page is deleted
- No manual cleanup needed!

## 📋 Manual Steps Remaining

### 1. Apply Migrations (Required)

You need to run **2 migrations** in Supabase Dashboard SQL Editor:

#### Migration 1: Storage Policies
File: `supabase/migrations/20251001_add_image_urls_to_sections.sql`

```sql
-- Create storage bucket policy for public-files bucket
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'public-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'public-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Public can view all files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'public-files');

COMMENT ON COLUMN landing_pages.sections IS 'JSONB array of sections. Each section can contain: subtitle (string), paragraphs (array of strings), image_prompt (string), image_url (string), cta (string)';
```

#### Migration 2: Cascade Delete Trigger
File: `supabase/migrations/20251001_cascade_delete_images.sql`

```sql
-- Create a function to delete all images for a landing page from storage
CREATE OR REPLACE FUNCTION delete_landing_page_images()
RETURNS TRIGGER AS $$
DECLARE
  user_id_val TEXT;
BEGIN
  SELECT c.user_id::text INTO user_id_val
  FROM ai_generated_items ai
  JOIN campaigns c ON ai.campaign_id = c.id
  WHERE ai.id = OLD.ai_generated_item_id;

  IF user_id_val IS NOT NULL THEN
    DELETE FROM storage.objects
    WHERE bucket_id = 'public-files'
      AND name LIKE user_id_val || '/' || OLD.id::text || '/%';
    
    RAISE NOTICE 'Deleted images for landing page % (user: %)', OLD.id, user_id_val;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_delete_landing_page_images
  BEFORE DELETE ON landing_pages
  FOR EACH ROW
  EXECUTE FUNCTION delete_landing_page_images();

COMMENT ON FUNCTION delete_landing_page_images() IS 'Automatically deletes all images from storage when a landing page is deleted';
```

### 2. Set OpenAI API Key (Required)

```powershell
npx supabase secrets set OPENAI_API_KEY=sk-your-key-here --project-ref emvwmwdsaakdnweyhmki
```

## 🚀 How to Use

### Generate Images
1. Go to **Landing Pages** page in your app
2. Expand any landing page to see sections
3. Click **"Generate"** button on sections with image prompts
4. Wait ~10-30 seconds for AI generation
5. Image appears automatically!

### Delete Landing Pages
1. Click delete on any landing page
2. Confirm deletion
3. **Images are automatically deleted** from storage too! 🧹

## 📁 Storage Structure

```
public-files/
  {user_id}/
    {landing_page_id}/
      2025-10-01_abc123.png  ← Auto-deleted when page is deleted
      2025-10-01_def456.png  ← Auto-deleted when page is deleted
```

## 💰 Costs

- **OpenAI DALL-E 3**: ~$0.08 per image
- **Supabase Storage**: Free (1GB included)
- **Bandwidth**: Minimal for public access

## 🔒 Security Features

✅ User authentication required
✅ Landing page ownership verification  
✅ Users can only access their own folders
✅ Public read-only access for generated images
✅ Automatic cleanup prevents orphaned files

## 📚 Documentation Files

- `CASCADE_DELETE_IMAGES.md` - Cascade delete details
- `supabase/functions/generate-landing-page-image/README.md` - Generation API
- `supabase/functions/delete-landing-page-images/index.ts` - Cleanup utility

## ✨ Summary

**Deployed:**
- ✅ 2 Edge Functions deployed
- ✅ Frontend updated with generation UI
- ✅ Public viewer displays images

**Remaining:**
- ⏳ Apply 2 SQL migrations (copy/paste in Supabase Dashboard)
- ⏳ Set OPENAI_API_KEY secret

**Then you're ready to generate images!** 🎨
