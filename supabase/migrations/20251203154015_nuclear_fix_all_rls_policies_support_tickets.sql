/*
  # NUCLEAR FIX: Drop ALL RLS Policies and Recreate Clean
  
  ## Problem
  Multiple overlapping RLS policies with wrong admin emails causing query failures
  Found policies with both old (ipalominopc) and new (ipalomino) emails
  
  ## Solution
  1. Drop EVERY policy on support_tickets table
  2. Create exactly 5 clean policies with correct emails
  
  ## Admin Emails (CORRECT)
  - ipalomino@gmail.com
  - isaac@goflexconnect.com
  - dev@goflexconnect.com
  
  ## Security
  - RLS remains enabled
  - Admins: Full SELECT/UPDATE/DELETE access
  - Users: SELECT own tickets only
  - All authenticated: Can INSERT tickets
*/

-- NUCLEAR OPTION: Drop every single policy
DO $$ 
DECLARE 
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'support_tickets') 
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON support_tickets';
  END LOOP;
END $$;

-- Policy 1: Admin SELECT - see all tickets
CREATE POLICY "admin_select_all"
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

-- Policy 2: User SELECT - see own tickets only
CREATE POLICY "user_select_own"
  ON support_tickets
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy 3: INSERT - all authenticated users can create tickets
CREATE POLICY "authenticated_insert"
  ON support_tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy 4: Admin UPDATE - full access
CREATE POLICY "admin_update_all"
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

-- Policy 5: Admin DELETE - full access
CREATE POLICY "admin_delete_all"
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