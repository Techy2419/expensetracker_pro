-- Fix ambiguous share_code column reference in get_profile_by_share_code function
-- The issue is that the function parameter name conflicts with the table column name

-- First drop the existing function
DROP FUNCTION IF EXISTS public.get_profile_by_share_code(TEXT);

-- Then create the new function with a different parameter name
CREATE FUNCTION public.get_profile_by_share_code(share_code_param TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    profile_record RECORD;
BEGIN
    -- Get profile by share code (using parameter name to avoid ambiguity)
    SELECT id, name, type, is_shared, share_code, created_at, user_id INTO profile_record 
    FROM public.expense_profiles 
    WHERE share_code = share_code_param 
    AND is_shared = TRUE;
    
    IF NOT FOUND THEN
        RETURN '{"success": false, "error": "Invalid share code"}'::jsonb;
    END IF;
    
    -- Get user profile information
    DECLARE
        user_profile RECORD;
    BEGIN
        SELECT full_name, email INTO user_profile
        FROM public.user_profiles
        WHERE id = profile_record.user_id;
        
        RETURN jsonb_build_object(
            'success', true,
            'data', jsonb_build_object(
                'id', profile_record.id,
                'name', profile_record.name,
                'type', profile_record.type,
                'is_shared', profile_record.is_shared,
                'share_code', profile_record.share_code,
                'created_at', profile_record.created_at,
                'user_profiles', jsonb_build_object(
                    'id', profile_record.user_id,
                    'full_name', COALESCE(user_profile.full_name, 'Unknown User'),
                    'email', COALESCE(user_profile.email, 'unknown@email.com')
                )
            )
        );
    END;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_profile_by_share_code(TEXT) TO authenticated;
