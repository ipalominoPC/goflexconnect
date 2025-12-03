/*
  # Fix Admin Access to Session Events
  
  ## Problem
  Admin dashboard Recent Activity showing no data because admins can't read session_events table
  
  ## Solution
  Add RLS policy allowing admin users to read ALL session events
  
  ## Changes
  - Add policy for admin users to SELECT all session events
  - Uses JWT email check (fast, no subquery)
*/

-- Add admin read policy for session_events
CREATE POLICY "Admins can read all session events"
  ON session_events
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt()->>'email') IN (
      'ipalominopc@gmail.com',
      'isaac@goflexconnect.com',
      'dev@goflexconnect.com'
    )
  );