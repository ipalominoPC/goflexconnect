/*
  # Create plan_overrides table for manual PRO access management

  1. New Tables
    - `plan_overrides`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users) - User being granted access
      - `plan_id` (text) - The plan to grant ('FREE' or 'PRO')
      - `granted_by` (uuid, references auth.users) - Admin who granted access
      - `reason` (text, nullable) - Optional note (e.g., "Beta tester", "Comped access")
      - `created_at` (timestamptz) - When override was created
      - `updated_at` (timestamptz) - When override was last modified
      
  2. Indexes
    - Primary index on user_id for fast lookups
    - Index on plan_id for filtering
    - Index on granted_by for admin tracking
    
  3. Security
    - Enable RLS on `plan_overrides` table
    - Users can read their own plan override (to check their effective plan)
    - Only admins can insert/update/delete plan overrides
    - Admin check: email IN approved admin list
    
  4. Constraints
    - One override per user (unique constraint on user_id)
    - plan_id must be 'FREE' or 'PRO'
*/

-- Create the plan_overrides table
CREATE TABLE IF NOT EXISTS plan_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id text NOT NULL CHECK (plan_id IN ('FREE', 'PRO')),
  granted_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure one override per user
  UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_plan_overrides_user_id ON plan_overrides(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_overrides_plan_id ON plan_overrides(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_overrides_granted_by ON plan_overrides(granted_by);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_plan_overrides_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER plan_overrides_updated_at
  BEFORE UPDATE ON plan_overrides
  FOR EACH ROW
  EXECUTE FUNCTION update_plan_overrides_updated_at();

-- Enable RLS
ALTER TABLE plan_overrides ENABLE ROW LEVEL SECURITY;

-- Users can SELECT their own plan override
CREATE POLICY "plan_overrides_user_select"
  ON plan_overrides
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins have full access (SELECT/INSERT/UPDATE/DELETE)
CREATE POLICY "plan_overrides_admin_all"
  ON plan_overrides
  FOR ALL
  TO authenticated
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (
      'ipalominopc@gmail.com',
      'isaac@goflexconnect.com',
      'isaac@goflexcloud.com',
      'dev@goflexconnect.com'
    )
  )
  WITH CHECK (
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (
      'ipalominopc@gmail.com',
      'isaac@goflexconnect.com',
      'isaac@goflexcloud.com',
      'dev@goflexconnect.com'
    )
  );
