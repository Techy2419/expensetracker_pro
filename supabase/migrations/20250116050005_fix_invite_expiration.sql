-- Location: supabase/migrations/20250116050005_fix_invite_expiration.sql
-- Fix: Remove invite link expiration and ensure proper ENUMs
-- Dependencies: Requires previous shared profiles migrations

-- 1. Update profile_type ENUM to ensure all values exist
DO $$ BEGIN
    CREATE TYPE public.profile_type AS ENUM ('personal', 'family', 'business', 'split_expense');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Update expense_category ENUM to ensure all values exist
DO $$ BEGIN
    CREATE TYPE public.expense_category AS ENUM ('food', 'transport', 'shopping', 'bills', 'entertainment', 'health', 'travel', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Update payment_method ENUM to ensure all values exist
DO $$ BEGIN
    CREATE TYPE public.payment_method AS ENUM ('cash', 'credit_card', 'debit_card', 'digital_wallet', 'bank_transfer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Remove expiration from profile_invitations table
ALTER TABLE public.profile_invitations 
DROP COLUMN IF EXISTS expires_at;

-- 5. Update the profile_invitations table to remove expiration logic
ALTER TABLE public.profile_invitations 
ALTER COLUMN status SET DEFAULT 'pending',
ALTER COLUMN status DROP DEFAULT;

-- 6. Update the status check constraint to remove 'expired'
ALTER TABLE public.profile_invitations 
DROP CONSTRAINT IF EXISTS profile_invitations_status_check;

ALTER TABLE public.profile_invitations 
ADD CONSTRAINT profile_invitations_status_check 
CHECK (status IN ('pending', 'accepted', 'declined'));

-- 7. Update the accept_profile_invitation function to remove expiration check
CREATE OR REPLACE FUNCTION public.accept_profile_invitation(invitation_code TEXT, user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    invitation RECORD;
BEGIN
    -- Get invitation details (no expiration check)
    SELECT * INTO invitation 
    FROM public.profile_invitations 
    WHERE invitation_code = accept_profile_invitation.invitation_code 
    AND status = 'pending';
    
    IF NOT FOUND THEN
        RETURN '{"success": false, "error": "Invalid invitation code"}'::jsonb;
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

-- 8. Update the join_profile_by_share_code function to be more robust
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
        RETURN '{"success": false, "error": "Invalid share code. Please check the code and try again."}'::jsonb;
    END IF;
    
    -- Check if user already has access
    SELECT EXISTS(
        SELECT 1 FROM public.profile_members 
        WHERE profile_id = profile_record.id 
        AND user_id = join_profile_by_share_code.user_id
    ) INTO existing_member;
    
    IF existing_member THEN
        RETURN '{"success": false, "error": "You already have access to this profile"}'::jsonb;
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
    
    RETURN '{"success": true, "profile_id": "' || profile_record.id || '", "profile_name": "' || profile_record.name || '"}'::jsonb;
END;
$$;

-- 9. Create a function to get profile by share code (for validation)
CREATE OR REPLACE FUNCTION public.get_profile_by_share_code(share_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    profile_record RECORD;
BEGIN
    -- Get profile by share code
    SELECT id, name, type, is_shared, share_code INTO profile_record 
    FROM public.expense_profiles 
    WHERE share_code = get_profile_by_share_code.share_code 
    AND is_shared = TRUE;
    
    IF NOT FOUND THEN
        RETURN '{"success": false, "error": "Invalid share code"}'::jsonb;
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'data', jsonb_build_object(
            'id', profile_record.id,
            'name', profile_record.name,
            'type', profile_record.type,
            'is_shared', profile_record.is_shared,
            'share_code', profile_record.share_code
        )
    );
END;
$$;

-- 10. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.accept_profile_invitation(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_profile_by_share_code(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_by_share_code(TEXT) TO authenticated;

-- 11. Update existing invitations to remove expiration
UPDATE public.profile_invitations 
SET status = 'pending' 
WHERE status = 'expired';

-- 12. Ensure all family profiles have share codes
UPDATE public.expense_profiles 
SET is_shared = TRUE, share_code = public.generate_share_code()
WHERE type = 'family' AND (share_code IS NULL OR is_shared = FALSE);

-- 13. Add existing profile owners as members if not already present
INSERT INTO public.profile_members (profile_id, user_id, role, permissions, status)
SELECT 
    ep.id,
    ep.user_id,
    'owner',
    '{"view": true, "edit": true, "delete": true, "invite": true}'::jsonb,
    'active'
FROM public.expense_profiles ep
WHERE ep.is_shared = TRUE
AND NOT EXISTS (
    SELECT 1 FROM public.profile_members pm WHERE pm.profile_id = ep.id
);
