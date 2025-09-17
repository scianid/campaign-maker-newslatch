-- Update ad_placement column to store structured ad copy (headline, body, cta)
-- First, let's create a backup of any existing data (if any)
-- Then alter the column type to JSONB

-- Alter the ad_placement column to JSONB to store structured data
ALTER TABLE ai_generated_items 
ALTER COLUMN ad_placement TYPE JSONB USING ad_placement::JSONB;

-- Add a comment to document the new structure
COMMENT ON COLUMN ai_generated_items.ad_placement IS 'Structured ad copy with headline, body, and cta fields';

-- Optionally, add a check constraint to ensure the structure
ALTER TABLE ai_generated_items 
ADD CONSTRAINT ad_placement_structure_check 
CHECK (
    ad_placement IS NULL OR (
        ad_placement ? 'headline' AND 
        ad_placement ? 'body' AND 
        ad_placement ? 'cta'
    )
);