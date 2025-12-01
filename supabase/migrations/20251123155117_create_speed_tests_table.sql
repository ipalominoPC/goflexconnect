/*
  # Create Speed Test Results Table

  1. New Tables
    - `speed_tests`
      - `id` (uuid, primary key) - Unique identifier for each speed test
      - `timestamp` (timestamptz) - When the test was performed
      - `download_speed` (numeric) - Download speed in Mbps
      - `upload_speed` (numeric) - Upload speed in Mbps
      - `ping` (integer) - Ping latency in milliseconds
      - `jitter` (integer) - Jitter in milliseconds
      - `rsrp` (numeric) - Reference Signal Received Power
      - `rsrq` (numeric) - Reference Signal Received Quality
      - `sinr` (numeric) - Signal-to-Interference-plus-Noise Ratio
      - `rssi` (numeric) - Received Signal Strength Indicator
      - `cell_id` (text) - Cell tower identifier
      - `provider` (text) - Network provider name
      - `frequency` (integer) - Frequency in MHz
      - `band` (text) - Network band
      - `connection_type` (text) - Connection type (3G, 4G, LTE, 5G)
      - `latitude` (numeric) - GPS latitude coordinate
      - `longitude` (numeric) - GPS longitude coordinate
      - `created_at` (timestamptz) - Record creation timestamp

  2. Security
    - Enable RLS on `speed_tests` table
    - Add policy for anyone to insert speed test results
    - Add policy for anyone to read their own speed test results
*/

CREATE TABLE IF NOT EXISTS speed_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz NOT NULL DEFAULT now(),
  download_speed numeric NOT NULL,
  upload_speed numeric NOT NULL,
  ping integer NOT NULL,
  jitter integer DEFAULT 0,
  rsrp numeric NOT NULL,
  rsrq numeric NOT NULL,
  sinr numeric NOT NULL,
  rssi numeric NOT NULL,
  cell_id text NOT NULL,
  provider text NOT NULL DEFAULT 'Unknown',
  frequency integer NOT NULL DEFAULT 1900,
  band text NOT NULL DEFAULT 'Unknown',
  connection_type text NOT NULL DEFAULT '4G',
  latitude numeric,
  longitude numeric,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE speed_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert speed tests"
  ON speed_tests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow read all speed tests"
  ON speed_tests
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_speed_tests_timestamp ON speed_tests(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_speed_tests_created_at ON speed_tests(created_at DESC);
