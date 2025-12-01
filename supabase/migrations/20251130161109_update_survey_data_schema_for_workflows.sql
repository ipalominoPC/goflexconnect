/*
  # Update survey_data table schema for unified workflows

  1. Schema Changes
    - Rename `ambient` → `ambient_reading` (JSONB with carrier, rsrp, rsrq, sinr, etc.)
    - Rename `indoor_speed` → `indoor_speedtests` (JSONB array of speedtest entries)
    - Rename `outdoor_speed` → `outdoor_speedtests` (JSONB array of speedtest entries)
    - Rename `survey_photos` → `site_photos` (JSONB array of photo objects)
    - Remove columns that are now stored in projects table: technician_name, technician_phone, project_location, date_completed
  
  2. Security
    - No changes to RLS policies
*/

-- Rename columns to match new workflow schema
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'survey_data' AND column_name = 'ambient'
  ) THEN
    ALTER TABLE survey_data RENAME COLUMN ambient TO ambient_reading;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'survey_data' AND column_name = 'indoor_speed'
  ) THEN
    ALTER TABLE survey_data RENAME COLUMN indoor_speed TO indoor_speedtests;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'survey_data' AND column_name = 'outdoor_speed'
  ) THEN
    ALTER TABLE survey_data RENAME COLUMN outdoor_speed TO outdoor_speedtests;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'survey_data' AND column_name = 'survey_photos'
  ) THEN
    ALTER TABLE survey_data RENAME COLUMN survey_photos TO site_photos;
  END IF;

  -- Drop columns that moved to projects table
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'survey_data' AND column_name = 'technician_name'
  ) THEN
    ALTER TABLE survey_data DROP COLUMN technician_name;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'survey_data' AND column_name = 'technician_phone'
  ) THEN
    ALTER TABLE survey_data DROP COLUMN technician_phone;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'survey_data' AND column_name = 'project_location'
  ) THEN
    ALTER TABLE survey_data DROP COLUMN project_location;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'survey_data' AND column_name = 'date_completed'
  ) THEN
    ALTER TABLE survey_data DROP COLUMN date_completed;
  END IF;
END $$;
