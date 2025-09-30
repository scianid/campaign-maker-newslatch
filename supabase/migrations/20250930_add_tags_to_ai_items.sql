-- Add tags column to ai_generated_items table
ALTER TABLE ai_generated_items ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Create index for tags for better query performance
CREATE INDEX IF NOT EXISTS idx_ai_generated_items_tags ON ai_generated_items USING GIN(tags);

-- Add comment to describe the column
COMMENT ON COLUMN ai_generated_items.tags IS 'Array of tags/categories for the AI generated content item';