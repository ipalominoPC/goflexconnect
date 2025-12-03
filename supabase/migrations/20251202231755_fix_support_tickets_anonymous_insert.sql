/*
  # Fix support tickets INSERT policy for anonymous users

  1. Changes
    - Drop the restrictive INSERT policy that requires auth.uid() = user_id
    - Create new INSERT policy that allows:
      - Authenticated users to insert tickets with their user_id
      - Anonymous users (not logged in) to insert tickets with NULL user_id
  
  2. Security
    - Authenticated users must set user_id to their own auth.uid()
    - Anonymous users must set user_id to NULL
    - This allows guest support tickets while preventing impersonation
*/

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "support_tickets_user_insert" ON support_tickets;

-- Policy: Authenticated users can insert tickets with their own user_id
CREATE POLICY "support_tickets_authenticated_insert"
  ON support_tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Anonymous users can insert tickets with NULL user_id
CREATE POLICY "support_tickets_anonymous_insert"
  ON support_tickets
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);
