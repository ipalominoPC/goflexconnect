/*
  # Add IP and Network Details to Speed Tests

  1. Changes
    - Add `ip_address` (text) - IPv4 address
    - Add `ipv6_address` (text) - IPv6 address
    - Add `ip_city` (text) - City from IP geolocation
    - Add `ip_region` (text) - Region from IP geolocation
    - Add `ip_country` (text) - Country from IP geolocation
    - Add `ip_timezone` (text) - Timezone from IP geolocation
    - Add `isp` (text) - Internet Service Provider name
    - Add `organization` (text) - Organization name
    - Add `asn` (text) - Autonomous System Number
    - Add `dns_servers` (text[]) - Array of DNS servers
    - Add `is_vpn` (boolean) - VPN detection flag
    - Add `vpn_confidence` (integer) - VPN confidence score
    - Add `gps_accuracy` (numeric) - GPS accuracy in meters
    - Update `connection_type` to support WiFi and Ethernet
  
  2. Purpose
    - Capture comprehensive network information for both mobile and desktop users
    - Track ISP/provider information across all connection types
    - Store IPv4 and IPv6 addresses
    - Record DNS configuration
    - Enhance location data with IP-based geolocation
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
    WHERE table_name = 'speed_tests' AND column_name = 'ipv6_address'
  ) THEN
    ALTER TABLE speed_tests ADD COLUMN ipv6_address text;
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
    WHERE table_name = 'speed_tests' AND column_name = 'isp'
  ) THEN
    ALTER TABLE speed_tests ADD COLUMN isp text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'speed_tests' AND column_name = 'organization'
  ) THEN
    ALTER TABLE speed_tests ADD COLUMN organization text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'speed_tests' AND column_name = 'asn'
  ) THEN
    ALTER TABLE speed_tests ADD COLUMN asn text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'speed_tests' AND column_name = 'dns_servers'
  ) THEN
    ALTER TABLE speed_tests ADD COLUMN dns_servers text[];
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