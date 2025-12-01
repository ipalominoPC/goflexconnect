/*
  # Create Floors Table for Multi-Floor Projects

  ## Overview
  This migration adds support for multi-floor buildings by creating a floors table
  that allows projects to have multiple floors, each with their own floor plan.

  ## Changes

  1. New Tables
    - `floors`
      - `id` (uuid, primary key) - Unique identifier for the floor
      - `project_id` (uuid, foreign key) - References the parent project
      - `name` (text) - Display name for the floor (e.g., "First Floor", "Lobby")
      - `level` (text) - Floor level identifier (e.g., "1", "2", "B1", "Ground")
      - `floor_plan_image` (text) - Base64 encoded floor plan image or PDF
      - `floor_plan_filename` (text) - Original filename of uploaded floor plan
      - `notes` (text) - Optional notes about the floor
      - `created_at` (timestamptz) - Timestamp when floor was created
      - `updated_at` (timestamptz) - Timestamp when floor was last updated
      - `user_id` (uuid, foreign key) - References auth.users

  2. Table Modifications
    - Add `floor_id` column to `measurements` table
    - Add foreign key constraint linking measurements to floors

  3. Security
    - Enable RLS on `floors` table
    - Users can view their own floors
    - Users can insert their own floors
    - Users can update their own floors
    - Users can delete their own floors

  ## Migration Strategy
  - Existing projects without floors will continue to work
  - New projects will use the floors system
  - Measurements without floor_id will still function (backward compatible)
*/

-- Create floors table
CREATE TABLE IF NOT EXISTS floors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  level text NOT NULL,
  floor_plan_image text,
  floor_plan_filename text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add floor_id to measurements table (nullable for backward compatibility)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'measurements' AND column_name = 'floor_id'
  ) THEN
    ALTER TABLE measurements ADD COLUMN floor_id uuid REFERENCES floors(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index on floor_id for faster queries
CREATE INDEX IF NOT EXISTS idx_measurements_floor_id ON measurements(floor_id);

-- Create index on project_id for faster floor lookups
CREATE INDEX IF NOT EXISTS idx_floors_project_id ON floors(project_id);

-- Enable RLS on floors table
ALTER TABLE floors ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own floors
CREATE POLICY "Users can view own floors"
  ON floors FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own floors
CREATE POLICY "Users can insert own floors"
  ON floors FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own floors
CREATE POLICY "Users can update own floors"
  ON floors FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own floors
CREATE POLICY "Users can delete own floors"
  ON floors FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
