-- Add image_url column to ai_generated_items table
ALTER TABLE ai_generated_items ADD COLUMN image_url TEXT;

-- Create index for image_url for better query performance
CREATE INDEX IF NOT EXISTS idx_ai_generated_items_image_url ON ai_generated_items(image_url);

-- Add comment to describe the column
COMMENT ON COLUMN ai_generated_items.image_url IS 'Social media/Open Graph image URL extracted from the news article link';