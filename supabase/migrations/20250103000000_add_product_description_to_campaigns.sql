-- Add product_description column to campaigns table
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS product_description TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN campaigns.product_description IS 'AI-generated product description focusing on specific product/service offerings and key features';
