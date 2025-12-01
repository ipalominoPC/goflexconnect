/*
  # Create ad_events table for ad tracking

  1. New Tables
    - `ad_events`
      - `id` (uuid, primary key) - Unique identifier for each event
      - `created_at` (timestamptz) - Timestamp when event occurred
      - `user_id` (uuid, foreign key) - References auth.users, nullable for anonymous
      - `ad_id` (text) - Identifier of the ad that was shown/clicked
      - `placement` (text) - Location where ad was displayed
      - `event_type` (text) - Type of event: 'impression' or 'click'
      - `user_agent` (text, nullable) - Browser user agent string
      - `client_ip` (text, nullable) - Client IP address (for future use)

  2. Security
    - Enable RLS on `ad_events` table
    - Add policy for authenticated users to insert their own events
    - Read access restricted (for future analytics/admin views)

  3. Indexes
    - Index on created_at for time-based queries
    - Index on ad_id for ad performance queries
    - Index on user_id for user activity tracking
*/

-- Create the ad_events table
CREATE TABLE IF NOT EXISTS ad_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ad_id text NOT NULL,
  placement text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('impression', 'click')),
  user_agent text,
  client_ip text
);

-- Enable Row Level Security
ALTER TABLE ad_events ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can insert events
CREATE POLICY "Authenticated users can insert ad events"
  ON ad_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Only service role can read events (for analytics/admin)
CREATE POLICY "Service role can read all ad events"
  ON ad_events
  FOR SELECT
  TO service_role
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ad_events_created_at ON ad_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ad_events_ad_id ON ad_events(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_events_user_id ON ad_events(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ad_events_placement ON ad_events(placement);
CREATE INDEX IF NOT EXISTS idx_ad_events_event_type ON ad_events(event_type);
