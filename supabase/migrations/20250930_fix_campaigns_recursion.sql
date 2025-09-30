-- Fix infinite recursion in campaigns table RLS policies

-- Drop all the problematic anonymous access policies that cause recursion
DROP POLICY IF EXISTS "Public access to ai_generated_items via landing pages" ON ai_generated_items;
DROP POLICY IF EXISTS "Public access to campaigns via landing pages" ON campaigns;
DROP POLICY IF EXISTS "Anonymous users can view active landing pages" ON landing_pages;
DROP POLICY IF EXISTS "Anonymous users can view ai_generated_items for landing pages" ON ai_generated_items;
DROP POLICY IF EXISTS "Anonymous users can view campaigns for landing pages" ON campaigns;

-- Create a simple policy for landing_pages that doesn't reference other tables
CREATE POLICY "Public can view active landing pages" ON landing_pages
    FOR SELECT 
    USING (is_active = true);

-- Since we're using service role in the edge function, we don't need complex RLS policies
-- for anonymous access to related tables. The service role bypasses RLS entirely.

-- Keep the existing user-based policies for authenticated users intact
-- (These should already exist and work fine)