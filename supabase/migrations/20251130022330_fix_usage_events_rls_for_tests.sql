/*
  # Fix RLS policies for usage_events to support self-tests

  1. Changes
    - Drop existing restrictive SELECT policy
    - Create new SELECT policy that explicitly allows users to read their own events
    - Ensure filtering by is_test column works correctly
  
  2. Security
    - Users can only SELECT their own usage_events (where user_id = auth.uid())
    - Admins can SELECT all usage_events
    - No changes to INSERT/DELETE policies
*/

-- Drop the existing user SELECT policy
DROP POLICY IF EXISTS "Users can read own usage events" ON usage_events;

-- Create new policy with explicit user_id check
CREATE POLICY "Users can read own usage events"
  ON usage_events
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR
    (SELECT email FROM auth.users WHERE id = auth.uid())::text = ANY (
      ARRAY['ipalominopc@gmail.com', 'isaac@goflexconnect.com', 'isaac@goflexcloud.com', 'dev@goflexconnect.com']::text[]
    )
  );
