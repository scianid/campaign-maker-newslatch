-- Fix the profiles UPDATE policy to prevent RLS recursion
-- The issue: WITH CHECK clause was reading from profiles while updating profiles

DROP POLICY IF EXISTS "users_update_own_profile" ON "public"."profiles";

-- Create new policy without the recursive is_admin check
-- Users can update their own profile but cannot change is_admin status
CREATE POLICY "users_update_own_profile" ON "public"."profiles" 
FOR UPDATE 
USING ("auth"."uid"() = "id")
WITH CHECK ("auth"."uid"() = "id");

-- Add a separate policy check to prevent non-admin users from modifying is_admin
-- This check happens at the column level via trigger instead of RLS
CREATE OR REPLACE FUNCTION prevent_is_admin_change()
RETURNS TRIGGER AS $$
DECLARE
  old_is_admin BOOLEAN;
  user_is_admin BOOLEAN;
BEGIN
  -- Get the old is_admin value
  old_is_admin := OLD.is_admin;
  
  -- If is_admin is being changed
  IF NEW.is_admin IS DISTINCT FROM old_is_admin THEN
    -- Check if the current user is an admin by looking at the OLD value
    -- This avoids the RLS recursion issue
    SELECT is_admin INTO user_is_admin 
    FROM profiles 
    WHERE id = auth.uid();
    
    -- Only allow admins to change is_admin status
    IF user_is_admin IS NOT TRUE THEN
      RAISE EXCEPTION 'Only administrators can modify admin status';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to enforce is_admin protection
DROP TRIGGER IF EXISTS protect_is_admin_column ON "public"."profiles";
CREATE TRIGGER protect_is_admin_column
  BEFORE UPDATE ON "public"."profiles"
  FOR EACH ROW
  EXECUTE FUNCTION prevent_is_admin_change();
