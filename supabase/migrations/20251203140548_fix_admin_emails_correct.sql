/*
  # Fix Admin Emails - Correct Owner Emails

  ## Changes
  - Drop all existing support_tickets policies
  - Recreate with CORRECT admin email addresses
  
  ## Correct Admin Emails
  - ipalomino@gmail.com (not ipalominopc)
  - isaac@goflexconnect.com
  - dev@goflexconnect.com
*/

DROP POLICY IF EXISTS "Admins can select all tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can select own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Authenticated users can insert tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can update all tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can delete all tickets" ON support_tickets;

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

CREATE POLICY "Users can select own tickets"
  ON support_tickets
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can insert tickets"
  ON support_tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

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