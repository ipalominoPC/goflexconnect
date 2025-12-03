/*
  # Fix Support Tickets - Admin Full Access + User Insert

  ## Changes
  1. Drop ALL existing RLS policies on support_tickets
  2. Create new permissive policies:
     - Admins can SELECT/UPDATE/DELETE everything
     - All authenticated users can INSERT (for ticket submission)
     - Users can SELECT their own tickets
  
  ## Admin Emails
  - ipalominopc@gmail.com
  - isaac@goflexconnect.com
  - isaac@goflexcloud.com
  - dev@goflexconnect.com
  
  ## Security
  - RLS remains enabled
  - Admins have full access via email check
  - Regular users can only see their own tickets
  - Everyone can create tickets (INSERT)
*/

-- Drop all existing policies on support_tickets
DROP POLICY IF EXISTS "Users can view their own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON support_tickets;
DROP POLICY IF EXISTS "Allow anonymous ticket creation" ON support_tickets;
DROP POLICY IF EXISTS "Users can insert their own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can insert tickets" ON support_tickets;
DROP POLICY IF EXISTS "Allow ticket insertion for all users" ON support_tickets;
DROP POLICY IF EXISTS "Anyone can create support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Allow public ticket creation" ON support_tickets;
DROP POLICY IF EXISTS "Public can create tickets" ON support_tickets;
DROP POLICY IF EXISTS "Allow authenticated insert" ON support_tickets;
DROP POLICY IF EXISTS "Users can select own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can select all tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can update all tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can delete all tickets" ON support_tickets;

-- Admin SELECT: Full access to all tickets
CREATE POLICY "Admins can select all tickets"
  ON support_tickets
  FOR SELECT
  TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (
      'ipalominopc@gmail.com',
      'isaac@goflexconnect.com', 
      'isaac@goflexcloud.com',
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

-- Admin UPDATE: Full access
CREATE POLICY "Admins can update all tickets"
  ON support_tickets
  FOR UPDATE
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

-- Admin DELETE: Full access
CREATE POLICY "Admins can delete all tickets"
  ON support_tickets
  FOR DELETE
  TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (
      'ipalominopc@gmail.com',
      'isaac@goflexconnect.com',
      'isaac@goflexcloud.com',
      'dev@goflexconnect.com'
    )
  );