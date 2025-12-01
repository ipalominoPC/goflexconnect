/*
  # Add test_email to admin_alerts type constraint

  1. Changes
    - Update admin_alerts.type constraint to include 'test_email'
    - Allows admin to trigger manual test emails and track them

  2. Security
    - No changes to RLS policies
    - Existing policies apply to new alert type
*/

-- Update the check constraint to include test_email
DO $$
BEGIN
  -- Drop existing constraint
  ALTER TABLE admin_alerts DROP CONSTRAINT IF EXISTS admin_alerts_type_check;
  
  -- Add updated constraint with test_email
  ALTER TABLE admin_alerts ADD CONSTRAINT admin_alerts_type_check 
    CHECK (type IN ('new_user', 'usage_threshold', 'bad_survey_quality', 'test_email'));
END $$;