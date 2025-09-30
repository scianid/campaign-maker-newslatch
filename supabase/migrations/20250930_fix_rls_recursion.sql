-- Fix infinite recursion in RLS policies for public landing page access

-- Drop the problematic policies that cause recursion
DROP POLICY IF EXISTS "Anonymous users can view ai_generated_items for landing pages" ON ai_generated_items;
DROP POLICY IF EXISTS "Anonymous users can view campaigns for landing pages" ON campaigns;

-- Create simpler, non-recursive policies

-- Allow anonymous users to read ai_generated_items that are linked to active landing pages
-- Use a direct approach without complex subqueries
CREATE POLICY "Public access to ai_generated_items via landing pages" ON ai_generated_items
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM landing_pages lp 
            WHERE lp.ai_generated_item_id = ai_generated_items.id 
            AND lp.is_active = true
        )
    );

-- Allow anonymous users to read campaigns that have ai_generated_items linked to active landing pages
-- Use a direct approach without complex subqueries
CREATE POLICY "Public access to campaigns via landing pages" ON campaigns
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM ai_generated_items ai
            JOIN landing_pages lp ON lp.ai_generated_item_id = ai.id
            WHERE ai.campaign_id = campaigns.id 
            AND lp.is_active = true
        )
    );