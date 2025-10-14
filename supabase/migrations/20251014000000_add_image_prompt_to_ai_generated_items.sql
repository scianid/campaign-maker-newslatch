-- Add image_prompt column to ai_generated_items table
ALTER TABLE public.ai_generated_items
ADD COLUMN IF NOT EXISTS image_prompt text;

-- Add comment to explain the column
COMMENT ON COLUMN public.ai_generated_items.image_prompt IS 'AI-generated prompt for image generation that fits the ad topic and selling message';
