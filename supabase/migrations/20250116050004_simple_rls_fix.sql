-- Location: supabase/migrations/20250116050004_simple_rls_fix.sql
-- Fix: Simple RLS policies without recursion
-- Dependencies: Requires previous shared profiles migrations

-- 1. Drop all problematic policies that cause recursion
DROP POLICY IF EXISTS "profile_invitations_manage" ON public.profile_invitations;
DROP POLICY IF EXISTS "profile_members_manage" ON public.profile_members;
DROP POLICY IF EXISTS "expense_profiles_shared_access" ON public.expense_profiles;
DROP POLICY IF EXISTS "expenses_shared_access" ON public.expenses;
DROP POLICY IF EXISTS "budgets_shared_access" ON public.budgets;
DROP POLICY IF EXISTS "profile_invitations_access" ON public.profile_invitations;
DROP POLICY IF EXISTS "profile_members_access" ON public.profile_members;
DROP POLICY IF EXISTS "expense_profiles_access" ON public.expense_profiles;
DROP POLICY IF EXISTS "expenses_access" ON public.expenses;
DROP POLICY IF EXISTS "budgets_access" ON public.budgets;

-- 2. Create simple, non-recursive policies for profile_invitations
CREATE POLICY "profile_invitations_simple"
ON public.profile_invitations
FOR ALL
TO authenticated
USING (
    profile_id IN (
        SELECT id FROM public.expense_profiles 
        WHERE user_id = auth.uid()
    )
);

-- 3. Create simple, non-recursive policies for profile_members
CREATE POLICY "profile_members_simple"
ON public.profile_members
FOR ALL
TO authenticated
USING (
    user_id = auth.uid() OR
    profile_id IN (
        SELECT id FROM public.expense_profiles 
        WHERE user_id = auth.uid()
    )
);

-- 4. Create simple, non-recursive policies for expense_profiles
CREATE POLICY "expense_profiles_simple"
ON public.expense_profiles
FOR ALL
TO authenticated
USING (
    user_id = auth.uid()
);

-- 5. Create simple, non-recursive policies for expenses
CREATE POLICY "expenses_simple"
ON public.expenses
FOR ALL
TO authenticated
USING (
    user_id = auth.uid()
);

-- 6. Create simple, non-recursive policies for budgets
CREATE POLICY "budgets_simple"
ON public.budgets
FOR ALL
TO authenticated
USING (
    user_id = auth.uid()
);

-- 7. Create the join function for share codes
CREATE OR REPLACE FUNCTION public.join_profile_by_share_code(share_code TEXT, user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    profile_record RECORD;
    existing_member BOOLEAN;
BEGIN
    -- Get profile by share code
    SELECT * INTO profile_record 
    FROM public.expense_profiles 
    WHERE share_code = join_profile_by_share_code.share_code 
    AND is_shared = TRUE;
    
    IF NOT FOUND THEN
        RETURN '{"success": false, "error": "Invalid or expired share link"}'::jsonb;
    END IF;
    
    -- Check if user already has access
    SELECT EXISTS(
        SELECT 1 FROM public.profile_members 
        WHERE profile_id = profile_record.id 
        AND user_id = join_profile_by_share_code.user_id
    ) INTO existing_member;
    
    IF existing_member THEN
        RETURN '{"success": false, "error": "User already has access to this profile"}'::jsonb;
    END IF;
    
    -- Add user as member
    INSERT INTO public.profile_members (
        profile_id, 
        user_id, 
        role, 
        permissions, 
        status
    ) VALUES (
        profile_record.id,
        join_profile_by_share_code.user_id,
        'member',
        '{"view": true, "edit": false, "delete": false, "invite": false}'::jsonb,
        'active'
    );
    
    RETURN '{"success": true, "profile_id": "' || profile_record.id || '"}'::jsonb;
END;
$$;

-- 8. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.join_profile_by_share_code(TEXT, UUID) TO authenticated;

-- 9. Create a function to check shared profile access
CREATE OR REPLACE FUNCTION public.user_has_shared_access(profile_id UUID, user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user owns the profile
    IF EXISTS (
        SELECT 1 FROM public.expense_profiles 
        WHERE id = profile_id AND user_id = user_has_shared_access.user_id
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user is a member of the profile
    IF EXISTS (
        SELECT 1 FROM public.profile_members 
        WHERE profile_id = user_has_shared_access.profile_id 
        AND user_id = user_has_shared_access.user_id 
        AND status = 'active'
    ) THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$;

-- 10. Grant execute permission on the access check function
GRANT EXECUTE ON FUNCTION public.user_has_shared_access(UUID, UUID) TO authenticated;
