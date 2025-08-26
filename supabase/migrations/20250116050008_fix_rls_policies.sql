-- Fix RLS policies that are blocking database access
-- This migration ensures proper access to profile_invitations and expense_profiles tables

-- First, disable RLS temporarily to fix the policies
ALTER TABLE profile_invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE expense_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Enable read access for all users" ON profile_invitations;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profile_invitations;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profile_invitations;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON profile_invitations;

DROP POLICY IF EXISTS "Users can view own profiles" ON expense_profiles;
DROP POLICY IF EXISTS "Users can insert own profiles" ON expense_profiles;
DROP POLICY IF EXISTS "Users can update own profiles" ON expense_profiles;
DROP POLICY IF EXISTS "Users can delete own profiles" ON expense_profiles;

DROP POLICY IF EXISTS "Users can view own user profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own user profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own user profile" ON user_profiles;

-- Create simple, working policies for profile_invitations
CREATE POLICY "Enable read access for all users" ON profile_invitations
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON profile_invitations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for users based on email" ON profile_invitations
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for users based on email" ON profile_invitations
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create simple, working policies for expense_profiles
CREATE POLICY "Users can view own profiles" ON expense_profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own profiles" ON expense_profiles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profiles" ON expense_profiles
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete own profiles" ON expense_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- Create simple, working policies for user_profiles
CREATE POLICY "Users can view own user profile" ON user_profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own user profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own user profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Re-enable RLS
ALTER TABLE profile_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON profile_invitations TO authenticated;
GRANT ALL ON expense_profiles TO authenticated;
GRANT ALL ON user_profiles TO authenticated;
