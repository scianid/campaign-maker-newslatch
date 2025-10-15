-- Ad Variants Feature Database Migration
-- Create ad_variants table and related structures

-- 1. Create ad_variants table
CREATE TABLE public.ad_variants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ai_generated_item_id uuid NOT NULL, -- Link to parent content
  
  -- Variant identification
  variant_label varchar(100), -- e.g., "Benefit Focus", "Urgency"
  display_order integer DEFAULT 0, -- Order in carousel (0 = original)
  
  -- Ad content (differs from parent)
  headline text NOT NULL,
  body text NOT NULL,
  cta text NOT NULL,
  headline_en text, -- English translation if needed
  body_en text,
  
  -- Image for this variant
  image_url text, -- Selected image for this specific variant
  image_prompt text NOT NULL, -- Unique prompt for this variant
  
  -- Metadata
  tone varchar(50), -- "professional", "casual", "urgent"
  focus varchar(50), -- "benefit", "pain_point", "urgency"
  
  -- User actions
  is_favorite boolean DEFAULT false, -- Star/favorite variants
  
  -- Audit
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT ad_variants_pkey PRIMARY KEY (id),
  CONSTRAINT ad_variants_ai_item_fkey FOREIGN KEY (ai_generated_item_id) 
    REFERENCES public.ai_generated_items(id) ON DELETE CASCADE
);

-- 2. Create indexes for performance
CREATE INDEX idx_ad_variants_ai_item ON public.ad_variants(ai_generated_item_id);
CREATE INDEX idx_ad_variants_favorite ON public.ad_variants(is_favorite);
CREATE INDEX idx_ad_variants_order ON public.ad_variants(display_order);

-- 3. Add variant tracking to ai_generated_items table
ALTER TABLE public.ai_generated_items 
  ADD COLUMN variant_count integer DEFAULT 0,
  ADD COLUMN favorite_variant_count integer DEFAULT 0;

-- Index for queries on variant counts
CREATE INDEX idx_ai_items_variant_count ON public.ai_generated_items(variant_count);

-- 4. Create trigger function to auto-update variant counts
CREATE OR REPLACE FUNCTION update_variant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.ai_generated_items
    SET 
      variant_count = variant_count - 1,
      favorite_variant_count = CASE 
        WHEN OLD.is_favorite THEN favorite_variant_count - 1 
        ELSE favorite_variant_count 
      END,
      updated_at = now()
    WHERE id = OLD.ai_generated_item_id;
    RETURN OLD;
  ELSIF TG_OP = 'INSERT' THEN
    UPDATE public.ai_generated_items
    SET 
      variant_count = variant_count + 1,
      favorite_variant_count = CASE 
        WHEN NEW.is_favorite THEN favorite_variant_count + 1 
        ELSE favorite_variant_count 
      END,
      updated_at = now()
    WHERE id = NEW.ai_generated_item_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_favorite != NEW.is_favorite THEN
      UPDATE public.ai_generated_items
      SET 
        favorite_variant_count = CASE 
          WHEN NEW.is_favorite THEN favorite_variant_count + 1 
          ELSE favorite_variant_count - 1 
        END,
        updated_at = now()
      WHERE id = NEW.ai_generated_item_id;
    END IF;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger
CREATE TRIGGER trigger_update_variant_count
  AFTER INSERT OR UPDATE OR DELETE ON public.ad_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_variant_count();

-- 6. Enable RLS on ad_variants table
ALTER TABLE public.ad_variants ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for ad_variants
-- Users can only see their own campaign variants
CREATE POLICY "Users can view their campaign variants" ON public.ad_variants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_generated_items ai
      JOIN public.campaigns c ON ai.campaign_id = c.id
      WHERE ai.id = ad_variants.ai_generated_item_id
        AND c.user_id = auth.uid()
    )
  );

-- Users can create variants for their campaigns
CREATE POLICY "Users can create variants" ON public.ad_variants
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ai_generated_items ai
      JOIN public.campaigns c ON ai.campaign_id = c.id
      WHERE ai.id = ai_generated_item_id
        AND c.user_id = auth.uid()
    )
  );

-- Users can update their variants
CREATE POLICY "Users can update variants" ON public.ad_variants
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_generated_items ai
      JOIN public.campaigns c ON ai.campaign_id = c.id
      WHERE ai.id = ad_variants.ai_generated_item_id
        AND c.user_id = auth.uid()
    )
  );

-- Users can delete their variants
CREATE POLICY "Users can delete variants" ON public.ad_variants
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_generated_items ai
      JOIN public.campaigns c ON ai.campaign_id = c.id
      WHERE ai.id = ad_variants.ai_generated_item_id
        AND c.user_id = auth.uid()
    )
  );

-- 8. Create function to initialize variant counts for existing items
CREATE OR REPLACE FUNCTION initialize_variant_counts()
RETURNS void AS $$
BEGIN
  UPDATE public.ai_generated_items 
  SET 
    variant_count = COALESCE((
      SELECT COUNT(*) 
      FROM public.ad_variants 
      WHERE ai_generated_item_id = ai_generated_items.id
    ), 0),
    favorite_variant_count = COALESCE((
      SELECT COUNT(*) 
      FROM public.ad_variants 
      WHERE ai_generated_item_id = ai_generated_items.id 
        AND is_favorite = true
    ), 0);
END;
$$ LANGUAGE plpgsql;

-- Initialize counts for existing items (if any)
SELECT initialize_variant_counts();

-- Drop the initialization function as it's no longer needed
DROP FUNCTION initialize_variant_counts();