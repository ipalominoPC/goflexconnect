/*
  # Create app_settings table for billing phase management

  1. New Tables
    - `app_settings`
      - `id` (uuid, primary key) - Single row identifier
      - `billing_phase` (text) - Current billing phase: 'BETA_FREE', 'NOTICE', 'PAID_LIVE'
      - `billing_notice_start_at` (timestamptz, nullable) - When notice period started
      - `billing_notice_days` (integer, nullable) - Number of days for notice period (default 14)
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `app_settings` table
    - Add policy for admins to read/update settings
    - Add policy for all authenticated users to read settings

  3. Initial Data
    - Insert default row with billing_phase = 'BETA_FREE'
*/

-- Create app_settings table
CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_phase text NOT NULL DEFAULT 'BETA_FREE' CHECK (billing_phase IN ('BETA_FREE', 'NOTICE', 'PAID_LIVE')),
  billing_notice_start_at timestamptz,
  billing_notice_days integer DEFAULT 14 CHECK (billing_notice_days > 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read app settings
CREATE POLICY "All authenticated users can read app settings"
  ON app_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only service role can update app settings (admin operations via service functions)
CREATE POLICY "Service role can update app settings"
  ON app_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Insert default settings row (only if table is empty)
INSERT INTO app_settings (billing_phase, billing_notice_days)
SELECT 'BETA_FREE', 14
WHERE NOT EXISTS (SELECT 1 FROM app_settings);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_app_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_app_settings_updated_at();
