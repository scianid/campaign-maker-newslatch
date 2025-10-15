-- Add keywords column to ai_generated_items table
-- This will store 5-10 relevant keywords for targeting and SEO

ALTER TABLE public.ai_generated_items 
  ADD COLUMN IF NOT EXISTS keywords text[] DEFAULT '{}';

-- Create GIN index for efficient keyword searches (future feature)
CREATE INDEX IF NOT EXISTS idx_ai_items_keywords 
  ON public.ai_generated_items USING GIN (keywords);

-- Add comment for documentation
COMMENT ON COLUMN public.ai_generated_items.keywords IS 
  'Array of 5-10 relevant keywords for SEO and targeting (industry terms, locations, topics, people, companies)';
