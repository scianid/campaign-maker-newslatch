-- Add index on is_published column for better filter performance
CREATE INDEX IF NOT EXISTS idx_ai_generated_items_is_published ON ai_generated_items(is_published);

-- Add composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_ai_generated_items_campaign_published ON ai_generated_items(campaign_id, is_published);