/*
  # Add Network and Carrier Metadata Columns

  ## Overview
  Add comprehensive network and carrier metadata detection to speed tests and measurements
  to improve data quality understanding and provide better recommendations to users.

  ## Changes

  ### `speed_tests` table
  Add network metadata columns:
  - `network_connection_type` (text, nullable) - Detected connection: 'wifi', 'cellular', or 'unknown'
  - `network_effective_type` (text, nullable) - Browser-reported effective type: '4g', '3g', '2g', etc.
  - `network_downlink` (float, nullable) - Estimated downlink speed in Mbps
  - `network_rtt` (float, nullable) - Round-trip time in milliseconds
  - `device_summary` (text, nullable) - Device type: 'iOS device', 'Android device', etc.
  - `manual_network_type` (text, nullable) - User-selected network type override
  - `carrier_name` (text, nullable) - User-entered carrier/operator name

  ### `measurements` table
  Add same network metadata columns for survey measurements

  ## Notes
  - All columns are nullable for backward compatibility
  - Older records without metadata will display as "Unknown" or "Not recorded"
  - Browser limitations mean detection is best-effort; native wrapper would improve accuracy
*/

-- Add network metadata columns to speed_tests table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'speed_tests' AND column_name = 'network_connection_type'
  ) THEN
    ALTER TABLE speed_tests ADD COLUMN network_connection_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'speed_tests' AND column_name = 'network_effective_type'
  ) THEN
    ALTER TABLE speed_tests ADD COLUMN network_effective_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'speed_tests' AND column_name = 'network_downlink'
  ) THEN
    ALTER TABLE speed_tests ADD COLUMN network_downlink double precision;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'speed_tests' AND column_name = 'network_rtt'
  ) THEN
    ALTER TABLE speed_tests ADD COLUMN network_rtt double precision;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'speed_tests' AND column_name = 'device_summary'
  ) THEN
    ALTER TABLE speed_tests ADD COLUMN device_summary text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'speed_tests' AND column_name = 'manual_network_type'
  ) THEN
    ALTER TABLE speed_tests ADD COLUMN manual_network_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'speed_tests' AND column_name = 'carrier_name'
  ) THEN
    ALTER TABLE speed_tests ADD COLUMN carrier_name text;
  END IF;
END $$;

-- Add network metadata columns to measurements table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'measurements' AND column_name = 'network_connection_type'
  ) THEN
    ALTER TABLE measurements ADD COLUMN network_connection_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'measurements' AND column_name = 'network_effective_type'
  ) THEN
    ALTER TABLE measurements ADD COLUMN network_effective_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'measurements' AND column_name = 'network_downlink'
  ) THEN
    ALTER TABLE measurements ADD COLUMN network_downlink double precision;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'measurements' AND column_name = 'network_rtt'
  ) THEN
    ALTER TABLE measurements ADD COLUMN network_rtt double precision;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'measurements' AND column_name = 'device_summary'
  ) THEN
    ALTER TABLE measurements ADD COLUMN device_summary text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'measurements' AND column_name = 'manual_network_type'
  ) THEN
    ALTER TABLE measurements ADD COLUMN manual_network_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'measurements' AND column_name = 'carrier_name'
  ) THEN
    ALTER TABLE measurements ADD COLUMN carrier_name text;
  END IF;
END $$;
