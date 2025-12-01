/*
  # Fix User Creation Trigger

  1. Changes
    - Enable pg_net extension for HTTP requests
    - Update trigger to handle errors gracefully
    - Ensure user creation never fails due to notification issues

  2. Security
    - Trigger continues to run with security definer privileges
    - Errors are logged but don't block user creation
*/

-- Enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Update function to handle errors gracefully
CREATE OR REPLACE FUNCTION public.notify_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  request_id bigint;
BEGIN
  -- Try to make HTTP request to edge function, but don't fail if it errors
  BEGIN
    SELECT
      extensions.http_post(
        url := 'https://rqxamghddsgdjlxtrbvu.supabase.co/functions/v1/new-user-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxeGFtZ2hkZHNnZGpseHRyYnZ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzg5MjYwOCwiZXhwIjoyMDc5NDY4NjA4fQ.lDglqU-P1EqQtxo9s_fsMXkzGWDWjJEj-fIvr2rN3n0'
        ),
        body := jsonb_build_object(
          'type', 'INSERT',
          'table', 'users',
          'record', jsonb_build_object(
            'id', NEW.id,
            'email', NEW.email,
            'created_at', NEW.created_at
          ),
          'schema', 'auth',
          'old_record', null
        )
      ) INTO request_id;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log the error but don't fail the user creation
      RAISE WARNING 'Failed to send new user notification: %', SQLERRM;
  END;
  
  -- Always return NEW to allow user creation to succeed
  RETURN NEW;
END;
$$;

-- Recreate trigger (it already exists, so we just ensure it's correct)
DROP TRIGGER IF EXISTS on_user_created ON auth.users;
CREATE TRIGGER on_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_user();
