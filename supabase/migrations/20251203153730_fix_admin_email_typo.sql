/*
  # Fix Admin Email Typo in RLS Policies
  
  ## Issue
  The RLS policies have 'ipalominopc@gmail.com' but the correct email is 'ipalomino@gmail.com'
  
  ## Changes
  1. Drop existing admin policies
  2. Recreate with correct email addresses:
     - ipalomino@gmail.com (FIXED - removed 'pc')
     - isaac@goflexconnect.com
     - dev@goflexconnect.com
  
  ## Security
  - RLS remains enabled
  - Admins have full SELECT/UPDATE/DELETE access
  - Regular users can only see their own tickets
  - All authenticated users can INSERT tickets
*/

-- Drop existing admin policies
DROP POLICY IF EXISTS "Admins can select all tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can update all tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can delete all tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can select own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Authenticated users can insert tickets" ON support_tickets;

-- Admin SELECT: Full access to all tickets (CORRECTED EMAILS)
CREATE POLICY "Admins can select all tickets"
  ON support_tickets
  FOR SELECT
  TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (
      'ipalomino@gmail.com',
      'isaac@goflexconnect.com',
      'dev@goflexconnect.com'
    )
  );

-- User SELECT: Own tickets only
CREATE POLICY "Users can select own tickets"
  ON support_tickets
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- INSERT: All authenticated users can create tickets
CREATE POLICY "Authenticated users can insert tickets"
  ON support_tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Admin UPDATE: Full access (CORRECTED EMAILS)
CREATE POLICY "Admins can update all tickets"
  ON support_tickets
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (
      'ipalomino@gmail.com',
      'isaac@goflexconnect.com',
      'dev@goflexconnect.com'
    )
  )
  WITH CHECK (
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (
      'ipalomino@gmail.com',
      'isaac@goflexconnect.com',
      'dev@goflexconnect.com'
    )
  );

-- Admin DELETE: Full access (CORRECTED EMAILS)
CREATE POLICY "Admins can delete all tickets"
  ON support_tickets
  FOR DELETE
  TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (
      'ipalomino@gmail.com',
      'isaac@goflexconnect.com',
      'dev@goflexconnect.com'
    )
  );