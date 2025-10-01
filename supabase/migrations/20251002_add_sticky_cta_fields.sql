-- Add sticky CTA fields to landing_pages table
-- These fields allow customization of the sticky bottom call-to-action bar

ALTER TABLE landing_pages
ADD COLUMN IF NOT EXISTS sticky_cta_title TEXT DEFAULT 'Ready to Take Action?',
ADD COLUMN IF NOT EXISTS sticky_cta_subtitle TEXT DEFAULT 'Click to visit the site and learn more',
ADD COLUMN IF NOT EXISTS sticky_cta_button TEXT DEFAULT 'Visit Site →',
ADD COLUMN IF NOT EXISTS sticky_cta_visible BOOLEAN DEFAULT TRUE;

-- Add comments to document the purpose of these columns
COMMENT ON COLUMN landing_pages.sticky_cta_title IS 'Title text for the sticky bottom CTA bar';
COMMENT ON COLUMN landing_pages.sticky_cta_subtitle IS 'Subtitle text for the sticky bottom CTA bar';
COMMENT ON COLUMN landing_pages.sticky_cta_button IS 'Button text for the sticky bottom CTA bar';
COMMENT ON COLUMN landing_pages.sticky_cta_visible IS 'Whether the sticky CTA bar is visible on the public landing page';
