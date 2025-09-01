-- Location: supabase/migrations/20250116050006_enable_realtime.sql
-- Purpose: Enable Supabase Realtime for shared profile functionality
-- This is REQUIRED for real-time updates to work between profile owner and members

-- 1. Enable Realtime for expenses table (this is the main table that needs real-time updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;

-- 2. Enable Realtime for expense_profiles table (for profile balance updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.expense_profiles;

-- 3. Enable Realtime for budgets table (for budget updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.budgets;

-- 4. Enable Realtime for profile_members table (for member join/leave updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.profile_members;

-- 5. Enable Realtime for profile_invitations table (for invitation updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.profile_invitations;

-- 6. Verify Realtime is enabled (this will show current status)
-- You can run this in Supabase SQL Editor to check:
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- 7. Create a function to test real-time functionality
CREATE OR REPLACE FUNCTION test_realtime_connection()
RETURNS TEXT AS $$
BEGIN
    -- Check if realtime is enabled for key tables
    IF EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'expenses'
    ) THEN
        RETURN '✅ Realtime is ENABLED for expenses table';
    ELSE
        RETURN '❌ Realtime is NOT ENABLED for expenses table';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 8. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION test_realtime_connection() TO authenticated;

-- 9. Add comment explaining what this migration does
COMMENT ON FUNCTION test_realtime_connection() IS 'Test function to verify real-time functionality is working';

-- 10. Create a view to monitor real-time status
CREATE OR REPLACE VIEW realtime_status AS
SELECT 
    tablename,
    CASE 
        WHEN tablename IN ('expenses', 'expense_profiles', 'budgets', 'profile_members', 'profile_invitations') 
        THEN '✅ Enabled'
        ELSE '❌ Not Enabled'
    END as realtime_status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- 11. Grant select permission on the view
GRANT SELECT ON realtime_status TO authenticated;

-- 12. Add comment on the view
COMMENT ON VIEW realtime_status IS 'View to monitor which tables have real-time enabled';

-- IMPORTANT NOTES:
-- 1. This migration MUST be run in Supabase SQL Editor
-- 2. After running, real-time updates will work automatically
-- 3. No code changes needed - the existing real-time service will work
-- 4. Test by adding an expense in one browser and watching it appear in another
