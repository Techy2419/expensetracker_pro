-- Location: supabase/migrations/20250116050002_fix_rls_recursion.sql
-- Fix: Resolve infinite recursion in RLS policies
-- Dependencies: Requires 20250116050000_shared_profiles.sql and 20250116050001_split_expense_profiles.sql

-- 1. Drop all problematic policies that cause recursion
DROP POLICY IF EXISTS "users_manage_shared_expense_profiles" ON public.expense_profiles;
DROP POLICY IF EXISTS "users_manage_shared_expenses" ON public.expenses;
DROP POLICY IF EXISTS "users_manage_shared_budgets" ON public.budgets;
DROP POLICY IF EXISTS "profile_members_view_own_profiles" ON public.profile_members;
DROP POLICY IF EXISTS "profile_members_manage_own_profiles" ON public.profile_members;
DROP POLICY IF EXISTS "profile_invitations_view_own" ON public.profile_invitations;
DROP POLICY IF EXISTS "profile_invitations_manage_own" ON public.profile_invitations;

-- 2. Create simple, non-recursive policies for expense_profiles
CREATE POLICY "expense_profiles_access"
ON public.expense_profiles
FOR ALL
TO authenticated
USING (
    user_id = auth.uid()
);

-- 3. Create simple, non-recursive policies for expenses
CREATE POLICY "expenses_access"
ON public.expenses
FOR ALL
TO authenticated
USING (
    user_id = auth.uid()
);

-- 4. Create simple, non-recursive policies for budgets
CREATE POLICY "budgets_access"
ON public.budgets
FOR ALL
TO authenticated
USING (
    user_id = auth.uid()
);

-- 5. Create simple, non-recursive policies for profile_members
CREATE POLICY "profile_members_access"
ON public.profile_members
FOR ALL
TO authenticated
USING (
    user_id = auth.uid()
);

-- 6. Create simple, non-recursive policies for profile_invitations
CREATE POLICY "profile_invitations_access"
ON public.profile_invitations
FOR ALL
TO authenticated
USING (
    invited_email = (SELECT email FROM public.user_profiles WHERE id = auth.uid())
);

-- 7. Add a function to check if user has access to a profile (for future use)
CREATE OR REPLACE FUNCTION public.user_has_profile_access(profile_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user owns the profile
    IF EXISTS (
        SELECT 1 FROM public.expense_profiles 
        WHERE id = profile_uuid AND user_id = auth.uid()
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user is a member of the profile
    IF EXISTS (
        SELECT 1 FROM public.profile_members 
        WHERE profile_id = profile_uuid AND user_id = auth.uid() AND status = 'active'
    ) THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$;

-- 8. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.user_has_profile_access(UUID) TO authenticated;
