-- Fix RLS policies for profiles table to allow users to read their own profile

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update admin status" ON profiles;

-- Create new, simpler policies
-- Allow users to view their own profile
CREATE POLICY "Enable read access for users to their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile (but not admin status)
CREATE POLICY "Enable update access for users to their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND is_admin = (SELECT is_admin FROM profiles WHERE id = auth.uid()));

-- Allow users to insert their own profile
CREATE POLICY "Enable insert access for users to create their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow admins to view all profiles
CREATE POLICY "Enable read access for admins to all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Allow admins to update any user's admin status
CREATE POLICY "Enable admin update access for admin users" ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Ensure the trigger function exists and is properly set up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, is_admin)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        FALSE
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();