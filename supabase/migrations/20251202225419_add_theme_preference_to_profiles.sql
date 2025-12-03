/*
  # Add theme preference to profiles

  1. Changes
    - Add `theme_preference` column to `profiles` table
    - Column stores user's preferred theme: 'light', 'dark', or 'system'
    - Defaults to 'system' to follow OS preference
  
  2. Notes
    - Uses IF NOT EXISTS to safely add column
    - Existing users will have NULL which will be treated as 'system'
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'theme_preference'
  ) THEN
    ALTER TABLE profiles ADD COLUMN theme_preference TEXT DEFAULT 'system';
  END IF;
END $$;
