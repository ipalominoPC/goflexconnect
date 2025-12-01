/*
  # Create Session Events Table for Security Logging

  ## Overview
  This migration creates the session_events table for tracking user session activities
  such as sign-in, sign-out, and project access for security monitoring and audit trails.

  ## New Tables

  ### `session_events`
  Stores session and security-related events for users
  - `id` (uuid, primary key) - Unique event identifier
  - `created_at` (timestamptz) - When the event occurred
  - `user_id` (uuid, foreign key) - References auth.users
  - `event_type` (text) - Type of event: "sign_in", "sign_out", "project_open"
  - `device_info` (text, nullable) - User agent or device description
  - `ip_address` (text, nullable) - Client IP address if available
  - `metadata` (jsonb, nullable) - Additional event-specific data

  ## Security
  - Enable RLS on session_events table
  - Users can INSERT their own events
  - Only service_role can SELECT (admin/security audit only)
  - No user-facing read access to prevent security info leakage

  ## Indexes
  - Index on user_id for faster user-specific queries
  - Index on created_at for time-based queries
  - Index on event_type for event filtering
*/

-- Create session_events table
CREATE TABLE IF NOT EXISTS session_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  device_info text,
  ip_address text,
  metadata jsonb
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_session_events_user_id ON session_events(user_id);
CREATE INDEX IF NOT EXISTS idx_session_events_created_at ON session_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_session_events_event_type ON session_events(event_type);

-- Enable Row Level Security
ALTER TABLE session_events ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can insert their own events
CREATE POLICY "Users can insert own session events"
  ON session_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Only service role can read events (for admin/audit)
CREATE POLICY "Service role can read all session events"
  ON session_events
  FOR SELECT
  TO service_role
  USING (true);

-- Add constraint to validate event types
ALTER TABLE session_events
  ADD CONSTRAINT valid_event_type
  CHECK (event_type IN ('sign_in', 'sign_out', 'project_open'));
