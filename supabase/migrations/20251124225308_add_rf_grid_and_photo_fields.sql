/*
  # Add RF Grid Testing and Photo Documentation Features

  ## Overview
  This migration adds support for RF grid testing with configurable grid sizes and
  photo documentation capabilities for measurements, enabling professional DAS deployment workflows.

  ## Changes

  1. Table Modifications - Floors
    - Add `grid_size` (integer) - Number of grid cells per side (e.g., 5 = 5x5 grid = 25 points)
    - Add `grid_enabled` (boolean) - Whether to show RF grid overlay during surveys

  2. Table Modifications - Measurements
    - Add `photo_url` (text) - Base64 encoded photo or URL to photo storage
    - Add `photo_caption` (text) - Optional caption or notes about the photo
    - Add `grid_x` (integer) - Grid column position (0-indexed)
    - Add `grid_y` (integer) - Grid row position (0-indexed)

  ## Benefits
  - Enables NFPA 1221 and IFC compliant grid testing (20x20 ft standard)
  - Provides visual documentation for each measurement point
  - Allows systematic coverage verification with grid labels (A1, B2, etc.)
  - Supports professional reporting with photo evidence

  ## Notes
  - All new fields are nullable for backward compatibility
  - Grid coordinates are 0-indexed for easier array mapping
  - Default grid size is 5x5 (20ft spacing for 100ft floor plan)
*/

-- Add grid configuration fields to floors table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'floors' AND column_name = 'grid_size'
  ) THEN
    ALTER TABLE floors ADD COLUMN grid_size integer DEFAULT 5;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'floors' AND column_name = 'grid_enabled'
  ) THEN
    ALTER TABLE floors ADD COLUMN grid_enabled boolean DEFAULT false;
  END IF;
END $$;

-- Add photo documentation and grid position fields to measurements table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'measurements' AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE measurements ADD COLUMN photo_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'measurements' AND column_name = 'photo_caption'
  ) THEN
    ALTER TABLE measurements ADD COLUMN photo_caption text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'measurements' AND column_name = 'grid_x'
  ) THEN
    ALTER TABLE measurements ADD COLUMN grid_x integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'measurements' AND column_name = 'grid_y'
  ) THEN
    ALTER TABLE measurements ADD COLUMN grid_y integer;
  END IF;
END $$;

-- Create composite index for grid-based queries
CREATE INDEX IF NOT EXISTS idx_measurements_grid_position ON measurements(floor_id, grid_x, grid_y);

-- Create index for measurements with photos
CREATE INDEX IF NOT EXISTS idx_measurements_with_photos ON measurements(floor_id) WHERE photo_url IS NOT NULL;
