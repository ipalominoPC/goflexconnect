/*
  # Add admin policies for usage_events table

  1. Changes
    - Add policy for admins to read all usage events (for self-tests and monitoring)
    - Add policy for admins to insert usage events for any user (for self-tests)
    - Add policy for admins to delete usage events (for self-test cleanup)

  2. Security
    - Only applies to admin users (checked via email domain)
    - Existing user policies remain unchanged
*/

-- Policy: Admins can read all usage events
CREATE POLICY "Admins can read all usage events"
  ON usage_events
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

-- Policy: Admins can insert usage events for any user (for self-tests)
CREATE POLICY "Admins can insert any usage events"
  ON usage_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (
      'ipalominopc@gmail.com',
      'isaac@goflexconnect.com',
      'isaac@goflexcloud.com',
      'dev@goflexconnect.com'
    )
  );

-- Policy: Admins can delete any usage events (for self-test cleanup)
CREATE POLICY "Admins can delete any usage events"
  ON usage_events
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