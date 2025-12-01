/*
  # Add is_test flag to usage_events table for self-test isolation

  1. Changes
    - Add `is_test` boolean column to usage_events table
    - Default to false for normal usage tracking
    - Self-tests will set this to true for easy cleanup

  2. Benefits
    - Allows self-tests to run without affecting real usage data
    - Easy cleanup of test data
    - Tests can run repeatedly without pollution
*/

-- Add is_test column
ALTER TABLE usage_events
ADD COLUMN IF NOT EXISTS is_test boolean DEFAULT false;

-- Create index for efficient test data queries
CREATE INDEX IF NOT EXISTS idx_usage_events_is_test ON usage_events(is_test) WHERE is_test = true;