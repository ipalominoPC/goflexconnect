/*
  # Add Location and VPN Detection Fields to Speed Tests

  1. Changes
    - Adds `ip_address` column to store user's IP address
    - Adds `ip_city` column to store city from IP lookup
    - Adds `ip_region` column to store region/state from IP lookup
    - Adds `ip_country` column to store country from IP lookup
    - Adds `ip_timezone` column to store timezone from IP lookup
    - Adds `is_vpn` column to flag if VPN was detected
    - Adds `vpn_confidence` column to store VPN detection confidence level (0-100)
    - Adds `gps_accuracy` column to store GPS accuracy in meters
    
  2. Notes
    - All new fields are nullable to maintain backward compatibility
    - These fields allow us to track both IP-based and GPS-based location
    - VPN detection helps ensure data quality for location-based surveys
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'speed_tests' AND column_name = 'ip_address'
  ) THEN
    ALTER TABLE speed_tests ADD COLUMN ip_address text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'speed_tests' AND column_name = 'ip_city'
  ) THEN
    ALTER TABLE speed_tests ADD COLUMN ip_city text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'speed_tests' AND column_name = 'ip_region'
  ) THEN
    ALTER TABLE speed_tests ADD COLUMN ip_region text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'speed_tests' AND column_name = 'ip_country'
  ) THEN
    ALTER TABLE speed_tests ADD COLUMN ip_country text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'speed_tests' AND column_name = 'ip_timezone'
  ) THEN
    ALTER TABLE speed_tests ADD COLUMN ip_timezone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'speed_tests' AND column_name = 'is_vpn'
  ) THEN
    ALTER TABLE speed_tests ADD COLUMN is_vpn boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'speed_tests' AND column_name = 'vpn_confidence'
  ) THEN
    ALTER TABLE speed_tests ADD COLUMN vpn_confidence integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'speed_tests' AND column_name = 'gps_accuracy'
  ) THEN
    ALTER TABLE speed_tests ADD COLUMN gps_accuracy numeric;
  END IF;
END $$;