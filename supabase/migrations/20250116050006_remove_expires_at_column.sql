-- Location: supabase/migrations/20250116050006_remove_expires_at_column.sql
-- Remove the expires_at column from profile_invitations table
-- Dependencies: Requires previous shared profiles migrations

-- 1. Remove the expires_at column from profile_invitations table
ALTER TABLE public.profile_invitations 
DROP COLUMN IF EXISTS expires_at;

-- 2. Update any existing invitations to ensure they have proper status
UPDATE public.profile_invitations 
SET status = 'pending' 
WHERE status IS NULL OR status = '';

-- 3. Ensure the status column has proper constraints
ALTER TABLE public.profile_invitations 
ALTER COLUMN status SET DEFAULT 'pending';

-- 4. Add a check constraint to ensure status is valid
ALTER TABLE public.profile_invitations 
DROP CONSTRAINT IF EXISTS profile_invitations_status_check;

ALTER TABLE public.profile_invitations 
ADD CONSTRAINT profile_invitations_status_check 
CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled'));

-- 5. Update the invitation creation function to not reference expires_at
CREATE OR REPLACE FUNCTION public.create_profile_invitation(
    profile_id UUID,
    invited_email TEXT,
    role TEXT DEFAULT 'member',
    permissions JSONB DEFAULT '{"view": true, "edit": false, "delete": false, "invite": false}'::jsonb,
    message TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    invitation_id UUID;
    invitation_code TEXT;
BEGIN
    -- Generate unique invitation code
    LOOP
        invitation_code := upper(substring(md5(random()::text) from 1 for 12));
        
        -- Check if code already exists
        IF NOT EXISTS(SELECT 1 FROM public.profile_invitations WHERE invitation_code = invitation_code) THEN
            EXIT;
        END IF;
    END LOOP;
    
    -- Create invitation
    INSERT INTO public.profile_invitations (
        profile_id,
        invited_email,
        role,
        permissions,
        invitation_code,
        message,
        status
    ) VALUES (
        profile_id,
        invited_email,
        role,
        permissions,
        invitation_code,
        message,
        'pending'
    ) RETURNING id INTO invitation_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'invitation_id', invitation_id,
        'invitation_code', invitation_code
    );
END;
$$;

-- 6. Grant execute permission on the new function
GRANT EXECUTE ON FUNCTION public.create_profile_invitation(UUID, TEXT, TEXT, JSONB, TEXT) TO authenticated;
