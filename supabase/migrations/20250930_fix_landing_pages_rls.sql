-- Ensure RLS policies for landing_pages allow anonymous access to active pages

-- Drop and recreate the anonymous access policy to make sure it's correct
DROP POLICY IF EXISTS "Anonymous users can view active landing pages" ON landing_pages;

-- Create policy for anonymous users to view active landing pages (for public access)
CREATE POLICY "Anonymous users can view active landing pages" ON landing_pages
    FOR SELECT 
    USING (is_active = TRUE);

-- Also ensure the ai_generated_items table allows access for the join
-- Check if there's a policy for anonymous access to ai_generated_items
DO $$ 
BEGIN
    -- Create a policy for anonymous users to view ai_generated_items when accessed through landing pages
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Anonymous users can view ai_generated_items for landing pages'
        AND tablename = 'ai_generated_items'
    ) THEN
        CREATE POLICY "Anonymous users can view ai_generated_items for landing pages" ON ai_generated_items
            FOR SELECT 
            USING (
                id IN (
                    SELECT ai_generated_item_id 
                    FROM landing_pages 
                    WHERE is_active = TRUE
                )
            );
    END IF;
END $$;

-- Check if there's a policy for anonymous access to campaigns
DO $$ 
BEGIN
    -- Create a policy for anonymous users to view campaigns when accessed through landing pages
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Anonymous users can view campaigns for landing pages'
        AND tablename = 'campaigns'
    ) THEN
        CREATE POLICY "Anonymous users can view campaigns for landing pages" ON campaigns
            FOR SELECT 
            USING (
                id IN (
                    SELECT c.id 
                    FROM campaigns c
                    JOIN ai_generated_items ai ON ai.campaign_id = c.id
                    JOIN landing_pages lp ON lp.ai_generated_item_id = ai.id
                    WHERE lp.is_active = TRUE
                )
            );
    END IF;
END $$;