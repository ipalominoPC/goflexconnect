/*
  # Create admin_alerts table for system notifications

  1. New Tables
    - `admin_alerts`
      - `id` (uuid, primary key)
      - `created_at` (timestamptz)
      - `user_id` (uuid, nullable, references auth.users)
      - `type` (text) - alert type: new_user, usage_threshold, bad_survey_quality
      - `title` (text) - alert title
      - `message` (text) - alert message
      - `metadata` (jsonb) - additional data
      - `is_read` (boolean) - whether admin has seen this alert

  2. Security
    - Enable RLS on `admin_alerts` table
    - Only authenticated users can read (admin check in app layer)
    - System can insert alerts
*/

CREATE TABLE IF NOT EXISTS admin_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('new_user', 'usage_threshold', 'bad_survey_quality')),
  title text NOT NULL,
  message text NOT NULL,
  metadata jsonb,
  is_read boolean DEFAULT false
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_admin_alerts_created_at ON admin_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_alerts_type ON admin_alerts(type);
CREATE INDEX IF NOT EXISTS idx_admin_alerts_is_read ON admin_alerts(is_read);

-- Enable RLS
ALTER TABLE admin_alerts ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read all alerts (admin check in app)
CREATE POLICY "Authenticated users can read admin alerts"
  ON admin_alerts
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can update alert read status
CREATE POLICY "Authenticated users can update alert status"
  ON admin_alerts
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can insert alerts (for system events)
CREATE POLICY "Authenticated users can insert admin alerts"
  ON admin_alerts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);