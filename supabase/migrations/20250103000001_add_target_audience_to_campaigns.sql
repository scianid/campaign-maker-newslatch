-- Add target_audience column to campaigns table
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS target_audience TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN campaigns.target_audience IS 'AI-generated target audience description identifying key demographics and characteristics of ideal customers';Q