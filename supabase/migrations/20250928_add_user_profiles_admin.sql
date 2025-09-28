-- Create profiles table to extend user information with admin permissions
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
-- Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Only allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Admins can update admin status of other users
CREATE POLICY "Admins can update admin status" ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Create function to handle new user signup and create profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, is_admin)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        FALSE
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create function to update profile updated_at timestamp
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profiles_updated_at();

-- Update RSS feeds policies to allow admin management
DROP POLICY IF EXISTS "Admins can manage RSS feeds" ON rss_feeds;

-- Create policies for admin management of RSS feeds
CREATE POLICY "Admins can view all RSS feeds" ON rss_feeds
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND (
            is_active = true OR 
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() AND is_admin = true
            )
        )
    );

CREATE POLICY "Admins can insert RSS feeds" ON rss_feeds
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Admins can update RSS feeds" ON rss_feeds
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Admins can delete RSS feeds" ON rss_feeds
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );