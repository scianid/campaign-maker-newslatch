-- Create table for storing AI-generated lead generation items
CREATE TABLE ai_generated_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    headline TEXT NOT NULL,
    clickbait TEXT NOT NULL,
    link TEXT NOT NULL,
    relevance_score INTEGER NOT NULL CHECK (relevance_score >= 0 AND relevance_score <= 100),
    trend TEXT NOT NULL,
    description TEXT NOT NULL,
    tooltip TEXT NOT NULL,
    ad_placement TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    ttl TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_ai_generated_items_campaign_id ON ai_generated_items(campaign_id);
CREATE INDEX idx_ai_generated_items_ttl ON ai_generated_items(ttl);
CREATE INDEX idx_ai_generated_items_is_published ON ai_generated_items(is_published);

-- Enable RLS (Row Level Security)
ALTER TABLE ai_generated_items ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their campaign's AI items
CREATE POLICY "Users can view AI items for their campaigns" ON ai_generated_items
    FOR SELECT USING (
        campaign_id IN (
            SELECT id FROM campaigns WHERE user_id = auth.uid()
        )
    );

-- Create policy to allow users to insert AI items for their campaigns
CREATE POLICY "Users can insert AI items for their campaigns" ON ai_generated_items
    FOR INSERT WITH CHECK (
        campaign_id IN (
            SELECT id FROM campaigns WHERE user_id = auth.uid()
        )
    );

-- Create policy to allow users to update AI items for their campaigns
CREATE POLICY "Users can update AI items for their campaigns" ON ai_generated_items
    FOR UPDATE USING (
        campaign_id IN (
            SELECT id FROM campaigns WHERE user_id = auth.uid()
        )
    );

-- Create policy to allow users to delete AI items for their campaigns
CREATE POLICY "Users can delete AI items for their campaigns" ON ai_generated_items
    FOR DELETE USING (
        campaign_id IN (
            SELECT id FROM campaigns WHERE user_id = auth.uid()
        )
    );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_generated_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_ai_generated_items_updated_at
    BEFORE UPDATE ON ai_generated_items
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_generated_items_updated_at();

-- Create function to clean up expired AI items
CREATE OR REPLACE FUNCTION cleanup_expired_ai_items()
RETURNS void AS $$
BEGIN
    DELETE FROM ai_generated_items WHERE ttl < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up expired items (if pg_cron extension is available)
-- This would need to be run manually or set up separately:
-- SELECT cron.schedule('cleanup-expired-ai-items', '0 2 * * *', 'SELECT cleanup_expired_ai_items();');