-- Location: supabase/migrations/20250116050001_split_expense_profiles.sql
-- Schema Update: Handle split_expense profiles after enum is committed
-- Dependencies: Requires 20250116050000_shared_profiles.sql migration

-- 1. Drop any remaining conflicting policies
DROP POLICY IF EXISTS "profile_members_view_own_profiles" ON public.profile_members;
DROP POLICY IF EXISTS "profile_members_manage_own_profiles" ON public.profile_members;
DROP POLICY IF EXISTS "profile_invitations_view_own" ON public.profile_invitations;
DROP POLICY IF EXISTS "profile_invitations_manage_own" ON public.profile_invitations;
DROP POLICY IF EXISTS "users_manage_shared_expense_profiles" ON public.expense_profiles;
DROP POLICY IF EXISTS "users_manage_shared_expenses" ON public.expenses;
DROP POLICY IF EXISTS "users_manage_shared_budgets" ON public.budgets;

-- 2. Recreate RLS policies with proper access control
CREATE POLICY "profile_members_view_own_profiles"
ON public.profile_members
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() OR 
    profile_id IN (
        SELECT id FROM public.expense_profiles 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "profile_members_manage_own_profiles"
ON public.profile_members
FOR ALL
TO authenticated
USING (
    profile_id IN (
        SELECT id FROM public.expense_profiles 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "profile_invitations_view_own"
ON public.profile_invitations
FOR SELECT
TO authenticated
USING (
    invited_email = (SELECT email FROM public.user_profiles WHERE id = auth.uid()) OR
    profile_id IN (
        SELECT id FROM public.expense_profiles 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "profile_invitations_manage_own"
ON public.profile_invitations
FOR ALL
TO authenticated
USING (
    profile_id IN (
        SELECT id FROM public.expense_profiles 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "users_manage_shared_expense_profiles"
ON public.expense_profiles
FOR ALL
TO authenticated
USING (
    user_id = auth.uid() OR 
    id IN (SELECT profile_id FROM public.profile_members WHERE user_id = auth.uid())
);

CREATE POLICY "users_manage_shared_expenses"
ON public.expenses
FOR ALL
TO authenticated
USING (
    user_id = auth.uid() OR 
    profile_id IN (SELECT profile_id FROM public.profile_members WHERE user_id = auth.uid())
);

CREATE POLICY "users_manage_shared_budgets"
ON public.budgets
FOR ALL
TO authenticated
USING (
    user_id = auth.uid() OR 
    profile_id IN (SELECT profile_id FROM public.profile_members WHERE user_id = auth.uid())
);

-- 3. Update existing split_expense profiles to be shared
UPDATE public.expense_profiles 
SET is_shared = TRUE,
    share_code = COALESCE(share_code, public.generate_share_code())
WHERE type = 'split_expense' AND share_code IS NULL;

-- 4. Add owners of split_expense profiles as members
INSERT INTO public.profile_members (profile_id, user_id, role, permissions)
SELECT 
    ep.id,
    ep.user_id,
    'owner',
    '{"view": true, "edit": true, "delete": true, "invite": true}'::jsonb
FROM public.expense_profiles ep
WHERE ep.type = 'split_expense'
AND NOT EXISTS (
    SELECT 1 FROM public.profile_members pm WHERE pm.profile_id = ep.id
);

-- 5. Function to handle new profile types automatically
CREATE OR REPLACE FUNCTION public.handle_new_profile_type()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- If new profile is family or split_expense, automatically make it shared
    IF NEW.type IN ('family', 'split_expense') THEN
        NEW.is_shared := TRUE;
        IF NEW.share_code IS NULL THEN
            NEW.share_code := public.generate_share_code();
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- 6. Trigger for automatic sharing of new family/split_expense profiles
DROP TRIGGER IF EXISTS on_new_profile_type ON public.expense_profiles;
CREATE TRIGGER on_new_profile_type
    BEFORE INSERT ON public.expense_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_profile_type();

-- 7. Add additional RLS policies for better access control
CREATE POLICY "profile_members_admin_access"
ON public.profile_members
FOR ALL
TO authenticated
USING (
    role = 'owner' OR role = 'admin' OR
    profile_id IN (
        SELECT id FROM public.expense_profiles 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "profile_invitations_admin_manage"
ON public.profile_invitations
FOR ALL
TO authenticated
USING (
    profile_id IN (
        SELECT ep.id FROM public.expense_profiles ep
        JOIN public.profile_members pm ON ep.id = pm.profile_id
        WHERE pm.user_id = auth.uid() AND pm.role IN ('owner', 'admin')
    )
);
