/*
  # Create usage_events table for tracking user activity and plan limits

  1. New Tables
    - `usage_events`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `event_type` (text) - type of usage event
      - `project_id` (uuid, nullable)
      - `survey_id` (uuid, nullable)
      - `count` (integer) - number of items/actions
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `usage_events` table
    - Add policy for users to insert their own events
    - Add policy for users to read their own events
*/

CREATE TABLE IF NOT EXISTS usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  project_id uuid,
  survey_id uuid,
  count integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_usage_events_user_id ON usage_events(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_event_type ON usage_events(event_type);
CREATE INDEX IF NOT EXISTS idx_usage_events_created_at ON usage_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_events_user_type ON usage_events(user_id, event_type);

-- Enable RLS
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own usage events
CREATE POLICY "Users can insert own usage events"
  ON usage_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can read their own usage events
CREATE POLICY "Users can read own usage events"
  ON usage_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);