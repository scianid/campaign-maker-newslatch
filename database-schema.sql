-- Campaign Maker Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Create enum type for RSS categories
CREATE TYPE category AS ENUM (
  'news',
  'entertainment', 
  'business',
  'sport',
  'politics',
  'technology',
  'health'
);

-- Create campaigns table for the Campaign Maker app with user authentication
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  description TEXT,
  rss_categories TEXT[] DEFAULT '{}',
  rss_countries TEXT[] DEFAULT ARRAY['US'],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at);
CREATE INDEX IF NOT EXISTS idx_campaigns_updated_at ON campaigns(updated_at);
CREATE INDEX IF NOT EXISTS idx_campaigns_name ON campaigns(name);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_rss_countries ON campaigns USING GIN(rss_countries);

-- Enable Row Level Security (RLS)
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Create policies for user-based access control
-- Users can only see and manage their own campaigns
CREATE POLICY "Users can view own campaigns" ON campaigns
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own campaigns" ON campaigns
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own campaigns" ON campaigns
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own campaigns" ON campaigns
FOR DELETE USING (auth.uid() = user_id);

-- Optional: Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on row changes
CREATE TRIGGER update_campaigns_updated_at 
    BEFORE UPDATE ON campaigns 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RSS Feeds Table
-- Create rss_feeds table to store RSS feed sources
CREATE TABLE IF NOT EXISTS rss_feeds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL UNIQUE,
  categories TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for RSS feeds table
CREATE INDEX IF NOT EXISTS idx_rss_feeds_active ON rss_feeds(is_active);
CREATE INDEX IF NOT EXISTS idx_rss_feeds_categories ON rss_feeds USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_rss_feeds_url ON rss_feeds(url);

-- Enable Row Level Security for RSS feeds
ALTER TABLE rss_feeds ENABLE ROW LEVEL SECURITY;

-- Create policy for RSS feeds (read-only for authenticated users)
CREATE POLICY "Authenticated users can view active RSS feeds" ON rss_feeds
FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);

-- Create trigger for RSS feeds updated_at
CREATE TRIGGER update_rss_feeds_updated_at 
    BEFORE UPDATE ON rss_feeds 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Note: Categories are handled as enum values, not as a separate table

-- Insert some sample RSS feeds
INSERT INTO rss_feeds (name, url, categories) VALUES
('BBC News', 'https://feeds.bbci.co.uk/news/rss.xml', ARRAY['news', 'politics']),
('TechCrunch', 'https://techcrunch.com/feed/', ARRAY['technology', 'business']),
('ESPN Top Stories', 'https://www.espn.com/espn/rss/news', ARRAY['sport']),
('Entertainment Weekly', 'https://ew.com/feed/', ARRAY['entertainment']),
('Reuters Health News', 'https://www.reuters.com/arc/outboundfeeds/rss/category/health/', ARRAY['health', 'news']),
('CNN Business', 'https://rss.cnn.com/rss/money_latest.rss', ARRAY['business', 'news']),
('Politico', 'https://www.politico.com/rss/politics08.xml', ARRAY['politics', 'news'])
ON CONFLICT (url) DO NOTHING;