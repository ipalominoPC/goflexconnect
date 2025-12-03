/*
  # Optimize RLS Performance - Remove Expensive Subqueries
  
  ## Problem
  Current policies do subquery `(SELECT email FROM auth.users WHERE id = auth.uid())`
  on EVERY row check, causing severe performance issues
  
  ## Solution
  Use auth.jwt() to get email directly from JWT token - much faster
  
  ## Changes
  Replace all subqueries with: (auth.jwt()->>'email')
*/

-- Drop all policies
DROP POLICY IF EXISTS "admin_delete_all" ON support_tickets;
DROP POLICY IF EXISTS "admin_select_all" ON support_tickets;
DROP POLICY IF EXISTS "admin_update_all" ON support_tickets;
DROP POLICY IF EXISTS "authenticated_insert" ON support_tickets;
DROP POLICY IF EXISTS "user_select_own" ON support_tickets;

-- Recreate with OPTIMIZED checks using JWT (no subqueries)
CREATE POLICY "admin_select_all"
  ON support_tickets
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt()->>'email') IN (
      'ipalominopc@gmail.com',
      'isaac@goflexconnect.com',
      'dev@goflexconnect.com'
    )
  );

CREATE POLICY "user_select_own"
  ON support_tickets
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "authenticated_insert"
  ON support_tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "admin_update_all"
  ON support_tickets
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt()->>'email') IN (
      'ipalominopc@gmail.com',
      'isaac@goflexconnect.com',
      'dev@goflexconnect.com'
    )
  )
  WITH CHECK (
    (auth.jwt()->>'email') IN (
      'ipalominopc@gmail.com',
      'isaac@goflexconnect.com',
      'dev@goflexconnect.com'
    )
  );

CREATE POLICY "admin_delete_all"
  ON support_tickets
  FOR DELETE
  TO authenticated
  USING (
    (auth.jwt()->>'email') IN (
      'ipalominopc@gmail.com',
      'isaac@goflexconnect.com',
      'dev@goflexconnect.com'
    )
  );