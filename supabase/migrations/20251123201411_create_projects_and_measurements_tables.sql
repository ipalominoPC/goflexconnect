/*
  # Create Projects and Measurements Tables

  ## Overview
  This migration creates the core tables needed for the offline-first survey functionality:
  - Projects table for storing survey project information
  - Measurements table for storing signal strength data points

  ## New Tables

  ### `projects`
  Stores survey project metadata including floor plans and location info
  - `id` (uuid, primary key) - Unique project identifier
  - `user_id` (uuid, foreign key) - Owner of the project (references auth.users)
  - `name` (text) - Project name
  - `location` (text, nullable) - Location description
  - `building_level` (text, nullable) - Building level/floor
  - `notes` (text, nullable) - Additional notes
  - `floor_plan_image` (text, nullable) - Base64 or URL to floor plan image
  - `created_at` (timestamptz) - When project was created
  - `updated_at` (timestamptz) - When project was last modified

  ### `measurements`
  Stores individual signal measurements taken during surveys
  - `id` (uuid, primary key) - Unique measurement identifier
  - `project_id` (uuid, foreign key) - Associated project
  - `user_id` (uuid, foreign key) - User who took measurement
  - `x` (numeric) - X coordinate on floor plan
  - `y` (numeric) - Y coordinate on floor plan
  - `location_number` (integer) - Sequential location number
  - `rsrp` (numeric) - Reference Signal Received Power
  - `rsrq` (numeric) - Reference Signal Received Quality
  - `sinr` (numeric) - Signal to Interference plus Noise Ratio
  - `rssi` (numeric) - Received Signal Strength Indicator
  - `cell_id` (text) - Cell tower identifier
  - `tech_type` (text) - Technology type (LTE, 5G, etc.)
  - `timestamp` (timestamptz) - When measurement was taken

  ## Security
  - Enable RLS on both tables
  - Users can only access their own projects and measurements
  - Policies for SELECT, INSERT, UPDATE, DELETE operations

  ## Indexes
  - Index on `project_id` in measurements table for faster queries
  - Index on `user_id` in both tables
*/

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  location text,
  building_level text,
  notes text,
  floor_plan_image text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create measurements table
CREATE TABLE IF NOT EXISTS measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  x numeric NOT NULL,
  y numeric NOT NULL,
  location_number integer NOT NULL,
  rsrp numeric NOT NULL,
  rsrq numeric NOT NULL,
  sinr numeric NOT NULL,
  rssi numeric NOT NULL,
  cell_id text NOT NULL,
  tech_type text NOT NULL,
  timestamp timestamptz DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_measurements_project_id ON measurements(project_id);
CREATE INDEX IF NOT EXISTS idx_measurements_user_id ON measurements(user_id);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Measurements policies
CREATE POLICY "Users can view own measurements"
  ON measurements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own measurements"
  ON measurements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own measurements"
  ON measurements FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own measurements"
  ON measurements FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add user_id to speed_tests if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'speed_tests' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE speed_tests ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_speed_tests_user_id ON speed_tests(user_id);
    
    -- Update existing RLS policies for speed_tests
    DROP POLICY IF EXISTS "Users can view own speed tests" ON speed_tests;
    DROP POLICY IF EXISTS "Users can insert own speed tests" ON speed_tests;
    
    CREATE POLICY "Users can view own speed tests"
      ON speed_tests FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert own speed tests"
      ON speed_tests FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
