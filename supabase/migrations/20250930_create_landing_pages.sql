-- Create table for storing landing pages
CREATE TABLE landing_pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ai_generated_item_id UUID NOT NULL REFERENCES ai_generated_items(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    paragraphs TEXT[] NOT NULL DEFAULT '{}',
    image_prompts TEXT[] NOT NULL DEFAULT '{}',
    cta TEXT NOT NULL,
    slug VARCHAR(255) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_landing_pages_ai_generated_item_id ON landing_pages(ai_generated_item_id);
CREATE INDEX idx_landing_pages_slug ON landing_pages(slug);
CREATE INDEX idx_landing_pages_is_active ON landing_pages(is_active);
CREATE INDEX idx_landing_pages_created_at ON landing_pages(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see landing pages for their AI items
CREATE POLICY "Users can view landing pages for their AI items" ON landing_pages
    FOR SELECT USING (
        ai_generated_item_id IN (
            SELECT ai.id FROM ai_generated_items ai
            JOIN campaigns c ON ai.campaign_id = c.id
            WHERE c.user_id = auth.uid()
        )
    );

-- Create policy to allow users to insert landing pages for their AI items
CREATE POLICY "Users can insert landing pages for their AI items" ON landing_pages
    FOR INSERT WITH CHECK (
        ai_generated_item_id IN (
            SELECT ai.id FROM ai_generated_items ai
            JOIN campaigns c ON ai.campaign_id = c.id
            WHERE c.user_id = auth.uid()
        )
    );

-- Create policy to allow users to update landing pages for their AI items
CREATE POLICY "Users can update landing pages for their AI items" ON landing_pages
    FOR UPDATE USING (
        ai_generated_item_id IN (
            SELECT ai.id FROM ai_generated_items ai
            JOIN campaigns c ON ai.campaign_id = c.id
            WHERE c.user_id = auth.uid()
        )
    );

-- Create policy to allow users to delete landing pages for their AI items
CREATE POLICY "Users can delete landing pages for their AI items" ON landing_pages
    FOR DELETE USING (
        ai_generated_item_id IN (
            SELECT ai.id FROM ai_generated_items ai
            JOIN campaigns c ON ai.campaign_id = c.id
            WHERE c.user_id = auth.uid()
        )
    );

-- Create policy for anonymous users to view active landing pages (for public access)
CREATE POLICY "Anonymous users can view active landing pages" ON landing_pages
    FOR SELECT USING (is_active = TRUE);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_landing_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_landing_pages_updated_at
    BEFORE UPDATE ON landing_pages
    FOR EACH ROW
    EXECUTE FUNCTION update_landing_pages_updated_at();

-- Create function to generate unique slug
CREATE OR REPLACE FUNCTION generate_landing_page_slug(title_text TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Convert title to slug format
    base_slug := lower(regexp_replace(title_text, '[^a-zA-Z0-9\s]', '', 'g'));
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    base_slug := trim(both '-' from base_slug);
    
    -- Limit slug length
    base_slug := left(base_slug, 200);
    
    final_slug := base_slug;
    
    -- Check for uniqueness and add counter if needed
    WHILE EXISTS (SELECT 1 FROM landing_pages WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Create function to auto-generate slug before insert
CREATE OR REPLACE FUNCTION set_landing_page_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := generate_landing_page_slug(NEW.title);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set slug
CREATE TRIGGER trigger_set_landing_page_slug
    BEFORE INSERT ON landing_pages
    FOR EACH ROW
    EXECUTE FUNCTION set_landing_page_slug();