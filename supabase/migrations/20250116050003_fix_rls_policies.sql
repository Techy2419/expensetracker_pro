-- Location: supabase/migrations/20250116050003_fix_rls_policies.sql
-- Fix: Resolve RLS policy issues for profile sharing
-- Dependencies: Requires previous shared profiles migrations

-- 1. Drop existing restrictive policies
DROP POLICY IF EXISTS "profile_invitations_access" ON public.profile_invitations;
DROP POLICY IF EXISTS "profile_members_access" ON public.profile_members;

-- 2. Create proper RLS policies for profile_invitations
CREATE POLICY "profile_invitations_manage"
ON public.profile_invitations
FOR ALL
TO authenticated
USING (
    -- Profile owners can manage invitations
    profile_id IN (
        SELECT id FROM public.expense_profiles 
        WHERE user_id = auth.uid()
    )
    OR
    -- Invited users can view their own invitations
    invited_email = (SELECT email FROM public.user_profiles WHERE id = auth.uid())
);

-- 3. Create proper RLS policies for profile_members
CREATE POLICY "profile_members_manage"
ON public.profile_members
FOR ALL
TO authenticated
USING (
    -- Profile owners can manage members
    profile_id IN (
        SELECT id FROM public.expense_profiles 
        WHERE user_id = auth.uid()
    )
    OR
    -- Members can view their own memberships
    user_id = auth.uid()
);

-- 4. Update the profile sharing function to handle share codes properly
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

-- 5. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.join_profile_by_share_code(TEXT, UUID) TO authenticated;

-- 6. Update expense_profiles RLS to allow shared access
DROP POLICY IF EXISTS "expense_profiles_access" ON public.expense_profiles;

CREATE POLICY "expense_profiles_shared_access"
ON public.expense_profiles
FOR ALL
TO authenticated
USING (
    user_id = auth.uid() OR 
    id IN (
        SELECT profile_id FROM public.profile_members 
        WHERE user_id = auth.uid() AND status = 'active'
    )
);

-- 7. Update expenses RLS to allow shared access
DROP POLICY IF EXISTS "expenses_access" ON public.expenses;

CREATE POLICY "expenses_shared_access"
ON public.expenses
FOR ALL
TO authenticated
USING (
    user_id = auth.uid() OR 
    profile_id IN (
        SELECT profile_id FROM public.profile_members 
        WHERE user_id = auth.uid() AND status = 'active'
    )
);

-- 8. Update budgets RLS to allow shared access
DROP POLICY IF EXISTS "budgets_access" ON public.budgets;

CREATE POLICY "budgets_shared_access"
ON public.budgets
FOR ALL
TO authenticated
USING (
    user_id = auth.uid() OR 
    profile_id IN (
        SELECT profile_id FROM public.profile_members 
        WHERE user_id = auth.uid() AND status = 'active'
    )
);
