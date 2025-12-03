/*
  # Fix RLS - Prevent auth.users Access Error for Regular Users

  ## Problem
  Regular users get "permission denied for table users" because RLS policies
  that check admin status try to SELECT from auth.users, which regular users
  cannot access.

  ## Solution
  Create a SECURITY DEFINER function that can safely check admin status
  without exposing auth.users to regular users.

  ## Changes
  1. Create is_admin_user() function with SECURITY DEFINER
  2. Update RLS policies to use this function instead of direct auth.users access
  3. Regular users will only match the second policy (own tickets)
  4. Admin users will match both policies (own + all tickets)
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can select all tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can select own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Authenticated users can insert tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can update all tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can delete all tickets" ON support_tickets;

-- Create security definer function to check admin status
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Get the email of the current user
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = auth.uid();
  
  -- Check if email is in admin list
  RETURN user_email IN (
    'ipalomino@gmail.com',
    'isaac@goflexconnect.com',
    'dev@goflexconnect.com'
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_admin_user() TO authenticated;

-- Recreate policies using the safe function
CREATE POLICY "Admins can select all tickets"
  ON support_tickets
  FOR SELECT
  TO authenticated
  USING (is_admin_user());

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
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

CREATE POLICY "Admins can delete all tickets"
  ON support_tickets
  FOR DELETE
  TO authenticated
  USING (is_admin_user());