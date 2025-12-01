/*
  # Rename octopus_images to rf_device_images

  1. Table Modifications
    - Rename `octopus_images` column to `rf_device_images` in donor_alignments table
    - This better reflects that these are RF Survey Device screenshots/photos
  
  2. No Security Changes
    - Existing RLS policies remain unchanged
*/

-- Rename column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'donor_alignments' AND column_name = 'octopus_images'
  ) THEN
    ALTER TABLE donor_alignments RENAME COLUMN octopus_images TO rf_device_images;
  END IF;
END $$;
