-- Fix infinite recursion in profiles RLS policies

-- Disable RLS temporarily to fix policies
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update admin status" ON profiles;
DROP POLICY IF EXISTS "Enable read access for users to their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable update access for users to their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert access for users to create their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for admins to all profiles" ON profiles;
DROP POLICY IF EXISTS "Enable admin update access for admin users" ON profiles;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
-- Allow users to read their own profile
CREATE POLICY "users_select_own_profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Allow users to insert their own profile  
CREATE POLICY "users_insert_own_profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile (excluding admin field)
CREATE POLICY "users_update_own_profile" ON profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND 
        is_admin = (
            SELECT COALESCE(p.is_admin, false) 
            FROM profiles p 
            WHERE p.id = auth.uid()
        )
    );

-- Allow service role full access (for admin functions)
CREATE POLICY "service_role_full_access" ON profiles
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Create a separate admin check function to avoid recursion
CREATE OR REPLACE FUNCTION is_admin_user(user_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id AND is_admin = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION is_admin_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_user(uuid) TO anon;