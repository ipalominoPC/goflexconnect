/*
  # Create commissioning checklist table

  1. New Tables
    - `commissioning_checklists`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `floor_id` (uuid, nullable, foreign key to floors)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text) - Checklist name
      - `category` (text) - Category like 'Pre-Install', 'Installation', 'Testing', 'Post-Install'
      - `items` (jsonb) - Array of checklist items with structure: {id, text, completed, notes}
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `completed_at` (timestamptz, nullable)
      - `status` (text) - 'in_progress', 'completed', 'archived'
  
  2. Security
    - Enable RLS on `commissioning_checklists` table
    - Add policies for authenticated users to manage their own checklists
*/

CREATE TABLE IF NOT EXISTS commissioning_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  floor_id uuid REFERENCES floors(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'in_progress'
);

ALTER TABLE commissioning_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own checklists"
  ON commissioning_checklists FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checklists"
  ON commissioning_checklists FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checklists"
  ON commissioning_checklists FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own checklists"
  ON commissioning_checklists FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_checklists_project_id ON commissioning_checklists(project_id);
CREATE INDEX IF NOT EXISTS idx_checklists_floor_id ON commissioning_checklists(floor_id);
CREATE INDEX IF NOT EXISTS idx_checklists_user_id ON commissioning_checklists(user_id);
