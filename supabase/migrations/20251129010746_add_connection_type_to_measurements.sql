/*
  # Add Connection Type Fields to Measurements and Speed Tests

  ## Overview
  Add network connection type tracking to measurements and speed tests to help identify
  whether data was collected over cellular or Wi-Fi networks.

  ## Changes

  ### `measurements` table
  - Add `connection_type` (text) - Type of connection: 'cellular', 'wifi', 'ethernet', or 'unknown'
  - Add `effective_type` (text, nullable) - Network effective type from browser: '2g', '3g', '4g', '5g', etc.

  ### `speed_tests` table
  - Add `connection_type` (text) - Type of connection: 'cellular', 'wifi', 'ethernet', or 'unknown'
  - Add `effective_type` (text, nullable) - Network effective type from browser: '2g', '3g', '4g', '5g', etc.

  ## Notes
  - Uses IF NOT EXISTS checks to safely add columns
  - Default value for connection_type is 'unknown' for backward compatibility
  - These fields help users understand data quality and recommend cellular connections for RF surveys
*/

-- Add connection_type and effective_type to measurements table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'measurements' AND column_name = 'connection_type'
  ) THEN
    ALTER TABLE measurements ADD COLUMN connection_type text DEFAULT 'unknown' NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'measurements' AND column_name = 'effective_type'
  ) THEN
    ALTER TABLE measurements ADD COLUMN effective_type text;
  END IF;
END $$;

-- Add connection_type and effective_type to speed_tests table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'speed_tests' AND column_name = 'connection_type'
  ) THEN
    ALTER TABLE speed_tests ADD COLUMN connection_type text DEFAULT 'unknown' NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'speed_tests' AND column_name = 'effective_type'
  ) THEN
    ALTER TABLE speed_tests ADD COLUMN effective_type text;
  END IF;
END $$;
