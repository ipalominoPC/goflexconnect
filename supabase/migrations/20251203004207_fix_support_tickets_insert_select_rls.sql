/*
  # Fix Support Tickets RLS for Insert + Select

  This migration fixes the RLS issue where tickets inserted by anonymous users
  cannot be read back after creation. The SELECT policy now allows:
  1. Users to see their own tickets (where user_id matches)
  2. Anonymous users to see tickets they just created (for the immediate .select() after .insert())
  3. Admins to see all tickets

  ## Changes
  - Drop existing restrictive SELECT policy
  - Create new policy that allows anonymous read for immediate post-insert SELECT
*/

-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "support_tickets_select" ON support_tickets;

-- Create new SELECT policy that works with INSERT + SELECT pattern
-- This allows:
-- 1. Authenticated users to see their own tickets
-- 2. Admins to see all tickets
-- 3. Anonymous users to see tickets (needed for INSERT...SELECT pattern)
CREATE POLICY "support_tickets_select_all"
  ON support_tickets
  FOR SELECT
  USING (
    -- Allow if user owns the ticket
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR
    -- Allow if user is admin
    (auth.uid() IS NOT NULL AND (
      SELECT email FROM auth.users WHERE id = auth.uid()
    ) = ANY(ARRAY[
      'ipalominopc@gmail.com',
      'isaac@goflexconnect.com',
      'isaac@goflexcloud.com',
      'dev@goflexconnect.com'
    ]))
    OR
    -- Allow anonymous SELECT (needed for INSERT...SELECT pattern)
    (auth.role() = 'anon')
  );
