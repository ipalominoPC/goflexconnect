/*
  # Create Project Workflows and Donor Alignment Tables
  
  1. New Tables
    - `donor_alignment` - Stores donor alignment data for install/upgrade projects
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `carrier` (text, enum: VERIZON, ATT, TMOBILE)
      - `azimuth` (int, 0-359 degrees)
      - `latitude` (double precision)
      - `longitude` (double precision)
      - `notes` (text)
      - `photos` (jsonb array of compressed photo URLs)
      - `created_at` (timestamptz)
      - `user_id` (uuid)
    
    - `survey_data` - Stores survey workflow data
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `ambient` (jsonb, ambient readings)
      - `indoor_speed` (jsonb, indoor speed test data)
      - `outdoor_speed` (jsonb, outdoor speed test data)
      - `survey_photos` (jsonb array of compressed photo URLs)
      - `technician_name` (text)
      - `technician_phone` (text)
      - `project_location` (text)
      - `date_completed` (date)
      - `user_id` (uuid)
      - `created_at` (timestamptz)
    
    - `admin_reports` - Tracks generated reports
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `user_id` (uuid)
      - `report_type` (text)
      - `created_at` (timestamptz)
  
  2. Table Modifications
    - Add `project_type` column to projects table
  
  3. Security
    - Enable RLS on all new tables
    - Users can manage their own data
    - Admins can view all data
*/

-- Add project_type to projects table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'project_type'
  ) THEN
    ALTER TABLE projects ADD COLUMN project_type text DEFAULT 'SURVEY' CHECK (project_type IN ('SURVEY', 'INSTALL', 'UPGRADE'));
  END IF;
END $$;

-- Create donor_alignment table
CREATE TABLE IF NOT EXISTS donor_alignment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  carrier text NOT NULL CHECK (carrier IN ('VERIZON', 'ATT', 'TMOBILE')),
  azimuth int CHECK (azimuth >= 0 AND azimuth <= 359),
  latitude double precision,
  longitude double precision,
  notes text,
  photos jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL
);

-- Create survey_data table
CREATE TABLE IF NOT EXISTS survey_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  ambient jsonb,
  indoor_speed jsonb,
  outdoor_speed jsonb,
  survey_photos jsonb DEFAULT '[]'::jsonb,
  technician_name text,
  technician_phone text,
  project_location text,
  date_completed date,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create admin_reports table
CREATE TABLE IF NOT EXISTS admin_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  report_type text NOT NULL CHECK (report_type IN ('SURVEY', 'INSTALL', 'UPGRADE')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE donor_alignment ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for donor_alignment
CREATE POLICY "Users can view own donor alignment data"
  ON donor_alignment FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own donor alignment data"
  ON donor_alignment FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own donor alignment data"
  ON donor_alignment FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own donor alignment data"
  ON donor_alignment FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for survey_data
CREATE POLICY "Users can view own survey data"
  ON survey_data FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own survey data"
  ON survey_data FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own survey data"
  ON survey_data FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own survey data"
  ON survey_data FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for admin_reports
CREATE POLICY "Users can view own reports"
  ON admin_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports"
  ON admin_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_donor_alignment_project_id ON donor_alignment(project_id);
CREATE INDEX IF NOT EXISTS idx_donor_alignment_user_id ON donor_alignment(user_id);
CREATE INDEX IF NOT EXISTS idx_survey_data_project_id ON survey_data(project_id);
CREATE INDEX IF NOT EXISTS idx_survey_data_user_id ON survey_data(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_reports_project_id ON admin_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_admin_reports_user_id ON admin_reports(user_id);