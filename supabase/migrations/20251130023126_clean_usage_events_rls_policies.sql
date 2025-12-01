/*
  # Clean RLS policies for usage_events table

  1. Changes
    - Drop ALL existing policies on usage_events
    - Create clean, efficient policies without expensive subqueries
    - Separate user policies (simple uid check) from admin policies (email check)
    
  2. Security Model
    
    **Regular Users (authenticated):**
    - INSERT: Can create events where user_id = auth.uid()
    - SELECT: Can read events where user_id = auth.uid()
    - DELETE: Can delete events where user_id = auth.uid() AND is_test = true
    - UPDATE: Not needed
    
    **Admins (specific emails):**
    - ALL: Full access to all rows (INSERT/SELECT/UPDATE/DELETE)
    - Admin check: email IN ('ipalominopc@gmail.com', 'isaac@goflexconnect.com', 'isaac@goflexcloud.com', 'dev@goflexconnect.com')

  3. Key Improvements
    - User policies use simple auth.uid() = user_id check (no subqueries)
    - Admin policies are separate and only run email check once
    - Policies are permissive (OR logic between them)
    - No expensive row-level subqueries for regular user access
*/

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users can insert own usage events" ON usage_events;
DROP POLICY IF EXISTS "Users can read own usage events" ON usage_events;
DROP POLICY IF EXISTS "Users can delete own test events" ON usage_events;
DROP POLICY IF EXISTS "Admins can insert any usage events" ON usage_events;
DROP POLICY IF EXISTS "Admins can read all usage events" ON usage_events;
DROP POLICY IF EXISTS "Admins can delete any usage events" ON usage_events;

-- ============================================================================
-- REGULAR USER POLICIES (Simple, efficient uid checks)
-- ============================================================================

-- Users can INSERT their own usage events
CREATE POLICY "usage_events_user_insert"
  ON usage_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can SELECT their own usage events
CREATE POLICY "usage_events_user_select"
  ON usage_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can DELETE their own test events only
CREATE POLICY "usage_events_user_delete_tests"
  ON usage_events
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND is_test = true);

-- ============================================================================
-- ADMIN POLICIES (Full access for specific admin emails)
-- ============================================================================

-- Admins have full access (ALL operations) on all rows
CREATE POLICY "usage_events_admin_all"
  ON usage_events
  FOR ALL
  TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (
      'ipalominopc@gmail.com',
      'isaac@goflexconnect.com',
      'isaac@goflexcloud.com',
      'dev@goflexconnect.com'
    )
  )
  WITH CHECK (
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (
      'ipalominopc@gmail.com',
      'isaac@goflexconnect.com',
      'isaac@goflexcloud.com',
      'dev@goflexconnect.com'
    )
  );
