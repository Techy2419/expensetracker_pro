-- Location: supabase/migrations/20250116050000_shared_profiles.sql
-- Schema Update: Add shared profile functionality for Family and Split Expense profiles
-- Dependencies: Requires existing expense_tracker_auth.sql migration

-- 0. SIMPLE CLEANUP - Only drop policies that might conflict with new table creation
-- Since we're using CREATE OR REPLACE POLICY, we don't need to drop all policies
-- Just ensure the tables are clean for creation
DROP TABLE IF EXISTS public.profile_members CASCADE;
DROP TABLE IF EXISTS public.profile_invitations CASCADE;

-- 1. Update profile_type ENUM to include 'split_expense'
ALTER TYPE public.profile_type ADD VALUE IF NOT EXISTS 'split_expense';

-- 2. Add sharing fields to expense_profiles table
ALTER TABLE public.expense_profiles 
ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS share_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS share_settings JSONB DEFAULT '{"allow_view": true, "allow_edit": false, "allow_delete": false}'::jsonb;

-- 3. Create profile_members table for shared profile access
CREATE TABLE IF NOT EXISTS public.profile_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.expense_profiles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    permissions JSONB DEFAULT '{"view": true, "edit": false, "delete": false, "invite": false}'::jsonb,
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    invited_by UUID REFERENCES public.user_profiles(id),
    status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended')),
    UNIQUE(profile_id, user_id)
);

-- 4. Create profile_invitations table for managing invites
CREATE TABLE IF NOT EXISTS public.profile_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.expense_profiles(id) ON DELETE CASCADE,
    invited_email TEXT NOT NULL,
    invited_by UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    permissions JSONB DEFAULT '{"view": true, "edit": false, "delete": false, "invite": false}'::jsonb,
    invitation_code TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days'),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMPTZ,
    message TEXT
);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profile_members_profile_id ON public.profile_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_members_user_id ON public.profile_members(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_invitations_profile_id ON public.profile_invitations(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_invitations_invited_email ON public.profile_invitations(invited_email);
CREATE INDEX IF NOT EXISTS idx_profile_invitations_invitation_code ON public.profile_invitations(invitation_code);
CREATE INDEX IF NOT EXISTS idx_expense_profiles_share_code ON public.expense_profiles(share_code);

-- 6. Enable RLS on new tables
ALTER TABLE public.profile_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_invitations ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS Policies for profile_members (no circular references)
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "profile_members_view_own_profiles" ON public.profile_members;
DROP POLICY IF EXISTS "profile_members_manage_own_profiles" ON public.profile_members;

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

-- 8. Create RLS Policies for profile_invitations (no circular references)
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "profile_invitations_view_own" ON public.profile_invitations;
DROP POLICY IF EXISTS "profile_invitations_manage_own" ON public.profile_invitations;

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

-- 9. Create RLS policies for expense_profiles to allow shared access
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "users_manage_shared_expense_profiles" ON public.expense_profiles;

CREATE POLICY "users_manage_shared_expense_profiles"
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

-- 10. Create RLS policies for expenses to allow shared access
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "users_manage_shared_expenses" ON public.expenses;

CREATE POLICY "users_manage_shared_expenses"
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

-- 11. Create RLS policies for budgets to allow shared access
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "users_manage_shared_budgets" ON public.budgets;

CREATE POLICY "users_manage_shared_budgets"
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

-- 12. Function to generate unique share codes
CREATE OR REPLACE FUNCTION public.generate_share_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    code TEXT;
    exists_already BOOLEAN;
BEGIN
    LOOP
        -- Generate a 8-character alphanumeric code
        code := upper(substring(md5(random()::text) from 1 for 8));
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM public.expense_profiles WHERE share_code = code) INTO exists_already;
        
        -- If code doesn't exist, return it
        IF NOT exists_already THEN
            RETURN code;
        END IF;
    END LOOP;
END;
$$;

-- 13. Function to automatically add owner as member when profile is shared
CREATE OR REPLACE FUNCTION public.handle_profile_sharing()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- If profile is being shared, add owner as member
    IF NEW.is_shared = TRUE AND OLD.is_shared = FALSE THEN
        -- Generate share code if not exists
        IF NEW.share_code IS NULL THEN
            NEW.share_code := public.generate_share_code();
        END IF;
        
        -- Add owner as member with full permissions
        INSERT INTO public.profile_members (profile_id, user_id, role, permissions)
        VALUES (
            NEW.id, 
            NEW.user_id, 
            'owner',
            '{"view": true, "edit": true, "delete": true, "invite": true}'::jsonb
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- 14. Trigger for automatic member addition
DROP TRIGGER IF EXISTS on_profile_sharing_changed ON public.expense_profiles;

CREATE OR REPLACE TRIGGER on_profile_sharing_changed
    AFTER UPDATE ON public.expense_profiles
    FOR EACH ROW
    WHEN (OLD.is_shared IS DISTINCT FROM NEW.is_shared)
    EXECUTE FUNCTION public.handle_profile_sharing();

-- 15. Function to accept invitation
CREATE OR REPLACE FUNCTION public.accept_profile_invitation(invitation_code TEXT, user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    invitation RECORD;
    result JSONB;
BEGIN
    -- Get invitation details
    SELECT * INTO invitation 
    FROM public.profile_invitations 
    WHERE invitation_code = accept_profile_invitation.invitation_code 
    AND status = 'pending' 
    AND expires_at > CURRENT_TIMESTAMP;
    
    IF NOT FOUND THEN
        RETURN '{"success": false, "error": "Invalid or expired invitation"}'::jsonb;
    END IF;
    
    -- Check if user already has access
    IF EXISTS(SELECT 1 FROM public.profile_members WHERE profile_id = invitation.profile_id AND user_id = accept_profile_invitation.user_id) THEN
        RETURN '{"success": false, "error": "User already has access to this profile"}'::jsonb;
    END IF;
    
    -- Add user as member
    INSERT INTO public.profile_members (profile_id, user_id, role, permissions, invited_by)
    VALUES (invitation.profile_id, accept_profile_invitation.user_id, invitation.role, invitation.permissions, invitation.invited_by);
    
    -- Update invitation status
    UPDATE public.profile_invitations 
    SET status = 'accepted', accepted_at = CURRENT_TIMESTAMP
    WHERE id = invitation.id;
    
    RETURN '{"success": true, "profile_id": "' || invitation.profile_id || '"}'::jsonb;
END;
$$;

-- 16. Update existing profiles to set appropriate sharing settings
-- Note: Only update family profiles for now, split_expense will be handled in a separate migration
UPDATE public.expense_profiles 
SET is_shared = CASE 
    WHEN type = 'family' THEN TRUE 
    ELSE FALSE 
END,
share_code = CASE 
    WHEN type = 'family' THEN public.generate_share_code()
    ELSE NULL 
END
WHERE share_code IS NULL;

-- 17. Add existing profile owners as members (only for family profiles)
INSERT INTO public.profile_members (profile_id, user_id, role, permissions)
SELECT 
    ep.id,
    ep.user_id,
    'owner',
    '{"view": true, "edit": true, "delete": true, "invite": true}'::jsonb
FROM public.expense_profiles ep
WHERE ep.type = 'family'
AND NOT EXISTS (
    SELECT 1 FROM public.profile_members pm WHERE pm.profile_id = ep.id
);
