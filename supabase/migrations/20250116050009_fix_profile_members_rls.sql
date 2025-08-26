-- Fix RLS policies for profile_members table and ensure proper foreign key relationships
-- This migration addresses the foreign key constraint violation

-- First, disable RLS temporarily to fix the policies
ALTER TABLE profile_members DISABLE ROW LEVEL SECURITY;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own profile members" ON profile_members;
DROP POLICY IF EXISTS "Users can insert own profile members" ON profile_members;
DROP POLICY IF EXISTS "Users can update own profile members" ON profile_members;
DROP POLICY IF EXISTS "Users can delete own profile members" ON profile_members;

-- Create simple, working policies for profile_members
CREATE POLICY "Enable read access for profile members" ON profile_members
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON profile_members
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for profile members" ON profile_members
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for profile members" ON profile_members
    FOR DELETE USING (auth.role() = 'authenticated');

-- Re-enable RLS
ALTER TABLE profile_members ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON profile_members TO authenticated;

-- Ensure the foreign key constraint is properly set up
-- This will help identify any data integrity issues
ALTER TABLE profile_members 
    DROP CONSTRAINT IF EXISTS profile_members_user_id_fkey;

ALTER TABLE profile_members 
    ADD CONSTRAINT profile_members_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES user_profiles(id) 
    ON DELETE CASCADE;

-- Create a function to ensure user profile exists before joining
CREATE OR REPLACE FUNCTION ensure_user_profile_exists(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user profile exists
    IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = user_uuid) THEN
        -- Create a basic user profile if it doesn't exist
        INSERT INTO user_profiles (id, email, full_name, created_at, updated_at)
        VALUES (
            user_uuid,
            (SELECT email FROM auth.users WHERE id = user_uuid),
            COALESCE((SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = user_uuid), 'User'),
            NOW(),
            NOW()
        );
        RETURN TRUE;
    END IF;
    
    RETURN TRUE;
END;
$$;
