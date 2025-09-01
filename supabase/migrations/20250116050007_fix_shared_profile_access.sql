-- Location: supabase/migrations/20250116050007_fix_shared_profile_access.sql
-- Purpose: Fix RLS policies to ensure shared profile members can access profile data
-- This fixes the issue where members can't see expenses from shared profiles

-- 1. Drop existing problematic policies
DROP POLICY IF EXISTS "users_can_view_own_expenses" ON public.expenses;
DROP POLICY IF EXISTS "users_can_view_own_profiles" ON public.expense_profiles;

-- 2. Create new comprehensive RLS policy for expenses that includes shared profile access
CREATE POLICY "users_can_view_own_and_shared_expenses"
ON public.expenses
FOR SELECT
TO authenticated
USING (
    -- User owns the profile
    profile_id IN (
        SELECT id FROM public.expense_profiles 
        WHERE user_id = auth.uid()
    )
    OR
    -- User is a member of the profile
    profile_id IN (
        SELECT profile_id FROM public.profile_members 
        WHERE user_id = auth.uid() AND status = 'active'
    )
);

-- 3. Create comprehensive RLS policy for expense_profiles
CREATE POLICY "users_can_view_own_and_shared_profiles"
ON public.expense_profiles
FOR SELECT
TO authenticated
USING (
    -- User owns the profile
    user_id = auth.uid()
    OR
    -- User is a member of the profile
    id IN (
        SELECT profile_id FROM public.profile_members 
        WHERE user_id = auth.uid() AND status = 'active'
    )
);

-- 4. Create comprehensive RLS policy for budgets
CREATE POLICY "users_can_view_own_and_shared_budgets"
ON public.budgets
FOR SELECT
TO authenticated
USING (
    -- User owns the profile
    profile_id IN (
        SELECT id FROM public.expense_profiles 
        WHERE user_id = auth.uid()
    )
    OR
    -- User is a member of the profile
    profile_id IN (
        SELECT profile_id FROM public.profile_members 
        WHERE user_id = auth.uid() AND status = 'active'
    )
);

-- 5. Create comprehensive RLS policy for profile_members
CREATE POLICY "users_can_view_own_and_shared_members"
ON public.profile_members
FOR SELECT
TO authenticated
USING (
    -- User owns the profile
    profile_id IN (
        SELECT id FROM public.expense_profiles 
        WHERE user_id = auth.uid()
    )
    OR
    -- User is a member of the profile
    profile_id IN (
        SELECT profile_id FROM public.profile_members 
        WHERE user_id = auth.uid() AND status = 'active'
    )
);

-- 6. Create comprehensive RLS policy for profile_invitations
CREATE POLICY "users_can_view_own_and_shared_invitations"
ON public.profile_invitations
FOR SELECT
TO authenticated
USING (
    -- User owns the profile
    profile_id IN (
        SELECT id FROM public.expense_profiles 
        WHERE user_id = auth.uid()
    )
    OR
    -- User is a member of the profile
    profile_id IN (
        SELECT profile_id FROM public.profile_members 
        WHERE user_id = auth.uid() AND status = 'active'
    )
    OR
    -- User is invited to the profile
    invited_email = (
        SELECT email FROM public.user_profiles 
        WHERE id = auth.uid()
    )
);

-- 7. Create a function to test shared profile access
CREATE OR REPLACE FUNCTION test_shared_profile_access(profile_id UUID)
RETURNS TABLE(
    user_id UUID,
    user_email TEXT,
    profile_name TEXT,
    can_access BOOLEAN,
    access_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id,
        up.email,
        ep.name,
        CASE 
            WHEN ep.user_id = auth.uid() THEN true
            WHEN pm.user_id = auth.uid() AND pm.status = 'active' THEN true
            ELSE false
        END as can_access,
        CASE 
            WHEN ep.user_id = auth.uid() THEN 'owner'
            WHEN pm.user_id = auth.uid() AND pm.status = 'active' THEN 'member'
            ELSE 'no_access'
        END as access_type
    FROM public.user_profiles up
    CROSS JOIN public.expense_profiles ep
    LEFT JOIN public.profile_members pm ON ep.id = pm.profile_id AND pm.user_id = up.id
    WHERE ep.id = profile_id AND up.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Grant execute permission
GRANT EXECUTE ON FUNCTION test_shared_profile_access(UUID) TO authenticated;

-- 9. Create a view to show shared profile access status
CREATE OR REPLACE VIEW shared_profile_access AS
SELECT 
    ep.id as profile_id,
    ep.name as profile_name,
    ep.user_id as owner_id,
    up.email as owner_email,
    pm.user_id as member_id,
    up2.email as member_email,
    pm.role as member_role,
    pm.status as member_status,
    pm.joined_at
FROM public.expense_profiles ep
JOIN public.user_profiles up ON ep.user_id = up.id
LEFT JOIN public.profile_members pm ON ep.id = pm.profile_id
LEFT JOIN public.user_profiles up2 ON pm.user_id = up2.id
WHERE ep.is_shared = true
ORDER BY ep.name, pm.joined_at;

-- 10. Grant select permission
GRANT SELECT ON shared_profile_access TO authenticated;

-- 11. Add comments
COMMENT ON FUNCTION test_shared_profile_access(UUID) IS 'Test function to verify shared profile access';
COMMENT ON VIEW shared_profile_access IS 'View to monitor shared profile access and members';

-- 12. Test the setup with a simple query
-- You can run this in Supabase SQL Editor to verify:
-- SELECT * FROM shared_profile_access;
-- SELECT test_shared_profile_access('your-profile-id-here');

-- IMPORTANT: After running this migration:
-- 1. Real-time updates will work (if you also ran the realtime migration)
-- 2. Shared profile members will be able to see expenses
-- 3. RLS policies will properly allow access to shared data
-- 4. Test by checking if members can see expenses from shared profiles
