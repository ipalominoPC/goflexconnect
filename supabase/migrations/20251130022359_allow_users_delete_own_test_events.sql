/*
  # Allow users to delete their own test events

  1. Changes
    - Add DELETE policy allowing users to delete their own test events (is_test = true)
    - This is safe because:
      - Users can only delete events where user_id = auth.uid()
      - Users can only delete test events (is_test = true)
      - Real usage events (is_test = false) cannot be deleted by users
  
  2. Security
    - Users can only delete their own test data
    - Real usage data remains protected
    - Admins retain ability to delete any usage events
*/

-- Allow users to delete their own test events only
CREATE POLICY "Users can delete own test events"
  ON usage_events
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id 
    AND is_test = true
  );
