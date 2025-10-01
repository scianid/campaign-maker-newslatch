-- Remove public/anonymous access to landing_pages, ai_generated_items, and campaigns
-- Public access is handled through the public-landing-page Edge Function using service role key

-- Drop the anonymous access policies that are no longer needed
DROP POLICY IF EXISTS "Anonymous users can view active landing pages" ON landing_pages;
DROP POLICY IF EXISTS "Anonymous users can view ai_generated_items for landing pages" ON ai_generated_items;
DROP POLICY IF EXISTS "Anonymous users can view campaigns for landing pages" ON campaigns;

-- Ensure landing_pages table has proper RLS policies for authenticated users only
-- Users should only be able to access their own landing pages

-- First, drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own landing pages" ON landing_pages;
DROP POLICY IF EXISTS "Users can insert their own landing pages" ON landing_pages;
DROP POLICY IF EXISTS "Users can update their own landing pages" ON landing_pages;
DROP POLICY IF EXISTS "Users can delete their own landing pages" ON landing_pages;

-- Create policies for authenticated users to manage their own landing pages
CREATE POLICY "Users can view their own landing pages" ON landing_pages
    FOR SELECT
    USING (
        ai_generated_item_id IN (
            SELECT ai.id FROM ai_generated_items ai
            JOIN campaigns c ON ai.campaign_id = c.id
            WHERE c.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own landing pages" ON landing_pages
    FOR INSERT
    WITH CHECK (
        ai_generated_item_id IN (
            SELECT ai.id FROM ai_generated_items ai
            JOIN campaigns c ON ai.campaign_id = c.id
            WHERE c.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own landing pages" ON landing_pages
    FOR UPDATE
    USING (
        ai_generated_item_id IN (
            SELECT ai.id FROM ai_generated_items ai
            JOIN campaigns c ON ai.campaign_id = c.id
            WHERE c.user_id = auth.uid()
        )
    )
    WITH CHECK (
        ai_generated_item_id IN (
            SELECT ai.id FROM ai_generated_items ai
            JOIN campaigns c ON ai.campaign_id = c.id
            WHERE c.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own landing pages" ON landing_pages
    FOR DELETE
    USING (
        ai_generated_item_id IN (
            SELECT ai.id FROM ai_generated_items ai
            JOIN campaigns c ON ai.campaign_id = c.id
            WHERE c.user_id = auth.uid()
        )
    );

-- Note: ai_generated_items and campaigns tables should already have proper RLS policies
-- that restrict access to the owner's data only. We're just removing the anonymous access policies.

-- Verify that RLS is enabled on all three tables
ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generated_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Add a comment for documentation
COMMENT ON TABLE landing_pages IS 'Landing pages table with RLS enabled. Public access is handled through the public-landing-page Edge Function using service role key. Direct database access is restricted to authenticated users who own the content.';
