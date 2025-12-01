/*
  # Simplify usage_events RLS policies

  1. Problem
    - Admin policy tries to query auth.users which causes permission denied
    - Tests are run BY admins AS regular authenticated users
    - Admin policy is not needed for self-tests
    
  2. Solution
    - Drop the admin policy that queries auth.users
    - Keep only simple user policies (uid checks)
    - Admins can use service_role key if needed for backend operations
    
  3. Final Policies
    - INSERT: Users insert where user_id = auth.uid()
    - SELECT: Users select where user_id = auth.uid()  
    - DELETE: Users delete where user_id = auth.uid() AND is_test = true
*/

-- Drop the problematic admin policy
DROP POLICY IF EXISTS "usage_events_admin_all" ON usage_events;

-- User policies remain (already correct):
-- - usage_events_user_insert (INSERT with WITH CHECK)
-- - usage_events_user_select (SELECT with USING)
-- - usage_events_user_delete_tests (DELETE with USING)
