# Ad Variations Feature - Planning Document (Simplified)

## Overview
Enable users to generate multiple variations of ad copy (headline, body, CTA) for A/B testing and different platforms. Each variant will have its own image prompt but won't generate images automatically - users can generate images later if needed.

---

## 1. UX/UI Design

### 1.1 Creation UX - Batch Generation

**Where**: On each AI content card on `/content/{campaignId}` page

**Flow**:
1. User sees "Generate Variants" button on each AI content item
2. Clicking opens a modal with options:
   - **Number of variants**: Slider or dropdown (2-5)
   - **Focus areas** (checkboxes):
     - ☑️ Different headlines
     - ☑️ Different body copy
     - ☑️ Different CTAs
     - ☑️ Different tones (professional, casual, urgent)
   - **Optional labels**: Text input for custom tags (e.g., "Facebook", "Young audience")
3. Click "Generate" - AI creates all variants at once
4. Modal shows loading state, then results
5. User can:
   - Review all generated variants
   - Star favorites (⭐)
   - Delete unwanted variants (🗑️)
   - Generate images and select what image is displayed on that varient for selected variants - later after generation of varients.
6. Click "Save Selected" to keep the variants

---

### 1.2 Display UX on `/content` Page

#### Integrated Carousel View (In Card)
```
┌─────────────────────────────────────────────────────────┐
│ 📰 News Headline                                        │
│ ⭐ 85/100 High  📈 Breaking  📢 Published               │
│                                                         │
│ 🎯 Ad Variants Carousel                                │
│ ┌───────────────────────────────────────────────────┐ │
│ │  [◄]   Variant 1/4: "Original" 🎯         [►]     │ │
│ │  ┌───────────────────────────────────────────┐    │ │
│ │  │  [Ad Preview - Banner Style]              │    │ │
│ │  │  Headline: Breaking: New Tax Laws...      │    │ │
│ │  │  Body: Small businesses need to...        │    │ │
│ │  │  CTA: Learn More                          │    │ │
│ │  └───────────────────────────────────────────┘    │ │
│ │                                                   │ │
│ │  🖼️ Image: [Original News Image ▼]               │ │
│ │  ┌─────────────────────────────────────────┐     │ │
│ │  │  [Image thumbnail or placeholder]         │     │ │
│ │  │  Click to select from gallery             │     │ │
│ │  └─────────────────────────────────────────┘     │ │
│ │                                                   │ │
│ │  [☆ Favorite] [🖼️ Gallery] [Generate Image]      │ │
│ └───────────────────────────────────────────────────┘ │
│                                                         │
│ Dots: ● ○ ○ ○  (4 variants)                           │
│ [+ Generate More Variants] [🗑️ Delete This Variant]    │
└─────────────────────────────────────────────────────────┘
```

#### Carousel Behavior

**Navigation:**
- Left/Right arrows (◄ ►) to switch between variants
- Dots at bottom show total variants and current position
- Keyboard: Arrow keys to navigate
- Touch/Swipe on mobile

**Per Variant (Carousel Item):**
```
┌───────────────────────────────────────────┐
│ Variant 2/4: "Benefit Focus" ⭐          │
│                                           │
│ [Ad Preview in selected format]           │
│ Headline: Save Money with New Benefits    │
│ Body: These changes could save you...     │
│ CTA: Get Free Consultation                │
│                                           │
│ 🖼️ Image: [Click to Select ▼]            │
│ ┌─────────────────────────────────────┐   │
│ │ [Current image or "No image"]       │   │
│ │ Click to open gallery                │   │
│ └─────────────────────────────────────┘   │
│                                           │
│ [⭐ Favorited] [🖼️ Gallery] [🎨 Gen AI]  │
└───────────────────────────────────────────┘
```

#### Image Gallery Integration

When user clicks 🖼️ Gallery button:
```
┌─────────────────────────────────────────────┐
│ Select Image for "Benefit Focus" Variant    │
├─────────────────────────────────────────────┤
│                                             │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐               │
│ │📰  │ │AI-1│ │AI-2│ │AI-3│               │
│ │✓   │ │    │ │    │ │    │               │
│ └────┘ └────┘ └────┘ └────┘               │
│ Original  Gen#1  Gen#2  Gen#3              │
│                                             │
│ [🎨 Generate New Image]    [Close]          │
└─────────────────────────────────────────────┘
```

**Gallery Features:**
- Shows all images available for this content item
- Original news image + all AI-generated images
- Click to select image for current variant
- Selected image marked with ✓
- Different variants can use different images
- "Generate New Image" uses the variant's specific `image_prompt`

#### Variant Actions (Per Carousel Item)

- **Star/Favorite** (⭐): Mark this variant as favorite
  - Shows filled star when favorited
  - Click again to unfavorite
  
- **Gallery** (�️): Open image selector modal
  - Shows all available images
  - Select one for this variant
  - Each variant can have different image
  
- **Generate Image** (🎨): AI-generate new image
  - Uses this variant's unique `image_prompt`
  - Adds to shared image pool
  - Auto-selects for this variant

- **Delete** (🗑️): Remove this variant
  - Button below carousel
  - Only shows if not the original/last variant
  - Confirmation modal before deletion

---

## 2. Content Generation Per Variation

### 2.1 What Gets Generated

For each variant, AI generates:

#### Core Ad Copy
1. **Headline** - Different angle or tone
   - Original: "Breaking: New Tax Laws Affect Small Businesses"
   - Variant 1: "Is Your Business Ready? New Tax Changes Explained"
   - Variant 2: "Tax Alert: What Small Businesses Must Know Now"

2. **Body Text** - Different messaging focus
   - Emphasize pain point
   - Emphasize benefit
   - Emphasize urgency
   - Social proof angle

3. **CTA** - Different action wording
   - "Learn More" vs "Get Started" vs "Free Consultation"
   - Language variations (for multi-language campaigns)

4. **Image Prompt** - Unique prompt for each variant
   - Same base concept but different emphasis
   - Example: "professional business meeting" vs "worried business owner at desk"
   - User can generate image later using this prompt

5. **Variant Label** - Auto-generated descriptive name
   - "Benefit Focus", "Urgency", "Professional Tone", etc.

### 2.2 Batch Generation API

```javascript
POST /functions/v1/generate-ad-variants
{
  "ai_item_id": "uuid",
  "count": 3,                    // How many variants to generate
  "options": {
    "vary_headline": true,
    "vary_body": true,
    "vary_cta": true,
    "tones": ["professional", "casual", "urgent"]  // optional
  }
}

Response:
{
  "variants": [
    {
      "variant_label": "Benefit Focus",
      "headline": "...",
      "body": "...",
      "cta": "...",
      "headline_en": "...",      // If non-English campaign
      "body_en": "...",
      "image_prompt": "...",
      "tone": "professional",
      "focus": "benefit"
    },
    // ... more variants
  ]
}
```

---

## 3. Number of Variations

### Approach: **2-5 Variants Per Content**

#### Reasoning:
1. **A/B Testing**: 2-3 variants + original is ideal for testing
2. **Not Overwhelming**: Too many options = decision paralysis
3. **Focused Testing**: Each variant tests a specific hypothesis

### Default Settings:
- **Default generation**: 3 variants
- **Range**: User can choose 2-5 when generating
- **No hard limit**: Users can generate more later
- **Original**: Cannot be deleted (it's the control)

### Suggested Variant Strategy:
1. **Original** - AI-generated base (control, cannot delete)
2. **Variant A** - Benefit-focused
3. **Variant B** - Urgency/pain-point focused  
4. **Variant C** - Different tone (casual/professional)
5. **Variant D** (optional) - CTA emphasis

---

## 4. Database Schema Changes

### 4.1 New Table: `ad_variants`

```sql
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

-- Indexes for performance
CREATE INDEX idx_ad_variants_ai_item ON public.ad_variants(ai_generated_item_id);
CREATE INDEX idx_ad_variants_favorite ON public.ad_variants(is_favorite);
CREATE INDEX idx_ad_variants_order ON public.ad_variants(display_order);
```

### 4.2 Modify Existing Table: `ai_generated_items`

```sql
-- Add variant tracking to parent
ALTER TABLE public.ai_generated_items 
  ADD COLUMN variant_count integer DEFAULT 0,
  ADD COLUMN favorite_variant_count integer DEFAULT 0;

-- Index for queries
CREATE INDEX idx_ai_items_variant_count ON public.ai_generated_items(variant_count);
```

### 4.3 Update Triggers

```sql
-- Auto-update variant count
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

CREATE TRIGGER trigger_update_variant_count
  AFTER INSERT OR UPDATE OR DELETE ON public.ad_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_variant_count();
```

### 4.4 RLS Policies

```sql
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

-- Enable RLS
ALTER TABLE public.ad_variants ENABLE ROW LEVEL SECURITY;
```

---

## 5. Additional Considerations

### 5.1 Edge Functions

#### New Function: `generate-ad-variants` (Batch)
```typescript
// supabase/functions/generate-ad-variants/index.ts
// Purpose: Generate multiple AI-powered variants at once
// Input: ai_item_id, count, options (what to vary)
// Output: Array of variant data
```

#### Update Function: `ai-content`
```typescript
// Add support to fetch variants
// Include variant_count and favorite_variant_count in response
// Add optional ?include_variants=true param
```

### 5.2 Frontend Components

#### New Components Needed:
1. **`VariantGeneratorModal.jsx`** - Modal for batch generating variants
2. **`VariantCarousel.jsx`** - Carousel component for displaying variants inline in card
3. **`VariantCarouselItem.jsx`** - Individual variant display within carousel
4. **`VariantImageSelector.jsx`** - Modal for selecting image from gallery for specific variant

#### Modified Components:
1. **`AiContentPage.jsx`** - Integrate VariantCarousel into each content card
2. **`ImageGalleryModal.jsx`** - Add variant-specific image selection support

### 5.3 API Endpoints

```
GET    /functions/v1/ad-variants?ai_item_id={id}  // Returns variants ordered by display_order
POST   /functions/v1/ad-variants/batch            // Batch generation
DELETE /functions/v1/ad-variants/{id}
PATCH  /functions/v1/ad-variants/{id}/favorite    // Toggle favorite
PATCH  /functions/v1/ad-variants/{id}/image       // Update image_url for variant
POST   /functions/v1/ad-variants/{id}/generate-image  // Generate image for specific variant
```

### 5.4 User Actions

#### Navigate Carousel (◄ ►)
- Left/Right arrows to switch between variants
- Dots show position (e.g., ● ○ ○ ○)
- Keyboard arrow keys supported
- Swipe gesture on mobile

#### Favorite (Star) ⭐
- Toggle favorite status for current variant
- Shows ⭐ when favorited, ☆ when not
- Track count in parent item
- Visual indicator in carousel header

#### Select Image (�️ Gallery)
- Opens modal showing all available images for this content
- Original news image + all AI-generated images
- Click to assign image to current variant
- Each variant can have different image
- Selected image persists in variant's `image_url`

#### Generate Image (🎨)
- Uses current variant's unique `image_prompt`
- Generates new image and adds to shared pool
- Auto-assigns generated image to this variant
- Same flow as existing image generation
- New image becomes available for other variants too

#### Delete 🗑️
- Button below carousel
- Confirmation modal: "Delete [Variant Label]?"
- Cannot delete if it's the only/last variant
- Updates parent item counts
- Carousel auto-navigates to next/previous variant

### 5.5 Edge Cases to Handle

1. **Deleting parent content**: Cascade delete all variants (handled by FK)
2. **No variants generated yet**: Show original content with "Generate Variants" button
3. **Generation fails**: Show error in modal, allow retry
4. **Duplicate detection**: Warn if generated variant is too similar to existing
5. **Image not selected**: Show placeholder "Click to select image" in carousel
6. **Last variant deletion**: Prevent deletion, show message "Cannot delete last variant"
7. **Variant has no image**: Show placeholder with "Select from gallery" prompt
8. **Shared image pool**: When generating image for one variant, it's available for all
9. **Carousel navigation**: Smoothly handle adding/removing variants during navigation

---

## 6. User Stories

### Story 1: Batch Generate Variants
```
As a marketer,
I want to generate 3 variants of my ad at once,
So that I can quickly test different approaches without manual work.
```

### Story 2: Mark Favorites
```
As a marketer testing multiple variants,
I want to star my favorite variants,
So that I can quickly identify the ones I want to use.
```

### Story 3: Delete Unwanted Variants
```
As a marketer reviewing generated variants,
I want to delete variants that don't meet my needs,
So that I only keep relevant variations.
```

### Story 4: Select Different Image Per Variant
```
As a marketer with multiple variants,
I want to assign different images to each variant,
So that I can test which image works best with which copy.
```

### Story 5: Navigate Variants in Carousel
```
As a marketer reviewing variants,
I want to use arrow keys and swipe gestures to navigate variants,
So that I can quickly compare them without leaving the card.
```

### Story 6: Generate Image for Specific Variant
```
As a marketer with a favorite variant,
I want to generate an AI image specifically for that variant,
So that I can visualize it with appropriate imagery.
```

---

## 7. Implementation Summary

### Phase 1: Database & API (Week 1)
- Create `ad_variants` table
- Add triggers for counts
- RLS policies
- Batch generation Edge Function

### Phase 2: UI (Week 2)
- "Generate Variants" button and modal
- Carousel component integration in content cards
- Carousel navigation (arrows, dots, keyboard, swipe)
- Star/delete actions per variant
- Image selector modal for variants

### Phase 3: AI Generation (Week 3)
- AI prompt for variant generation
- Support for different tones/focus
- Quality validation

### Phase 4: Testing & Polish (Week 4)
- User testing
- Bug fixes
- Performance optimization

**Total: ~4 weeks** for MVP

---

## 8. Key Technical Notes

1. **Carousel integration**: Variants displayed inline within the content card, not in separate modal
2. **Image per variant**: Each variant has its own `image_url` field, can select different images
3. **Shared image pool**: All generated images available to all variants of same content
4. **No automatic image generation**: Variants include `image_prompt`, user generates on demand per variant
5. **Batch generation**: All variants created in one API call
6. **Simple actions**: Star (favorite), delete, select image, generate image
7. **No tier limits**: Start with unlimited variants, add limits later if needed
8. **Cascade delete**: Deleting parent content removes all variants automatically
9. **Display order**: Variants maintain order in carousel via `display_order` field
10. **Navigation**: Support arrow keys, click navigation, and touch/swipe gestures

---

**Document Version**: 2.0 (Simplified)  
**Last Updated**: October 15, 2025  
**Status**: Planning Phase - Ready for Implementation  
**Next Step**: Start with Phase 1 (Database & API)
