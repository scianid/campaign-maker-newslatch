-- Migration to cascade delete images from storage when landing page is deleted

-- Create a function to delete all images for a landing page from storage
CREATE OR REPLACE FUNCTION delete_landing_page_images()
RETURNS TRIGGER AS $$
DECLARE
  user_id_val TEXT;
  image_paths TEXT[];
  image_path TEXT;
BEGIN
  -- Get the user_id from the campaign
  SELECT c.user_id::text INTO user_id_val
  FROM ai_generated_items ai
  JOIN campaigns c ON ai.campaign_id = c.id
  WHERE ai.id = OLD.ai_generated_item_id;

  -- If we have a user_id and landing_page_id, delete all images in that folder
  IF user_id_val IS NOT NULL THEN
    -- Build the path pattern: user_id/landing_page_id/
    -- Delete all files in the storage bucket matching this pattern
    DELETE FROM storage.objects
    WHERE bucket_id = 'public-files'
      AND name LIKE user_id_val || '/' || OLD.id::text || '/%';
    
    RAISE NOTICE 'Deleted images for landing page % (user: %)', OLD.id, user_id_val;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically delete images when landing page is deleted
DROP TRIGGER IF EXISTS trigger_delete_landing_page_images ON landing_pages;

CREATE TRIGGER trigger_delete_landing_page_images
  BEFORE DELETE ON landing_pages
  FOR EACH ROW
  EXECUTE FUNCTION delete_landing_page_images();

-- Add comment
COMMENT ON FUNCTION delete_landing_page_images() IS 'Automatically deletes all images from storage when a landing page is deleted';
