-- Migration to support image URLs in landing page sections
-- The sections column is already JSONB, so we don't need to alter the structure
-- This migration is for documentation purposes and to create storage policies

-- Create storage bucket policy for public-files bucket
-- Allow authenticated users to upload files to their own folders
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'public-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete files from their own folders
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'public-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to all files in public-files bucket
CREATE POLICY "Public can view all files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'public-files');

-- Add comment to document the expected section structure
COMMENT ON COLUMN landing_pages.sections IS 'JSONB array of sections. Each section can contain: subtitle (string), paragraphs (array of strings), image_prompt (string), image_url (string), cta (string)';
