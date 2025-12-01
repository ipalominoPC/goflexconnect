/*
  # Add plan override columns to profiles table
  
  1. Changes
    - Add `plan_override` (text) - Manual plan override: NULL (no override), 'FREE', or 'PRO'
    - Add `plan_override_reason` (text) - Admin note explaining why override was granted
    - Add `plan_override_expires_at` (timestamptz) - Optional expiry date for the override
    
  2. Security
    - Users can SELECT their own override status (read-only via existing RLS)
    - Only admins can UPDATE plan overrides
    - Add admin-only UPDATE policy for plan override columns
    
  3. Notes
    - Backward compatible: existing profiles get NULL values (no override)
    - Expired overrides (expires_at < now()) are treated as no override
    - Integrates with resolveUserPlan() function in application code
*/

-- Add plan override columns to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'plan_override'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN plan_override text CHECK (plan_override IN ('FREE', 'PRO')) NULL,
    ADD COLUMN plan_override_reason text NULL,
    ADD COLUMN plan_override_expires_at timestamptz NULL;
  END IF;
END $$;

-- Create index for querying active overrides
CREATE INDEX IF NOT EXISTS idx_profiles_plan_override ON profiles(plan_override) WHERE plan_override IS NOT NULL;

-- Admin-only UPDATE policy for plan overrides
-- Admins can update any user's plan override fields
CREATE POLICY "profiles_admin_update_overrides"
  ON profiles
  FOR UPDATE
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
