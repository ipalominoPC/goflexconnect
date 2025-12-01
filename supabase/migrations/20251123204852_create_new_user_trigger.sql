/*
  # Create New User Registration Trigger

  1. Changes
    - Creates a trigger on auth.users table to notify when new users register
    - Calls the new-user-notification Edge Function when a user is created
    
  2. Security
    - Trigger runs with security definer privileges
    - Only triggers on INSERT operations
*/

-- Create function to call the edge function
CREATE OR REPLACE FUNCTION public.notify_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  request_id bigint;
BEGIN
  -- Make HTTP request to edge function
  SELECT
    net.http_post(
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
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_user_created ON auth.users;
CREATE TRIGGER on_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_user();