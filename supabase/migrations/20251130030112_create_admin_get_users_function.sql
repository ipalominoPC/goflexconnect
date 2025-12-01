/*
  # Create admin function to list all users

  1. New Functions
    - `get_all_users_admin()` - Returns all users from auth.users
      - Only callable by approved admin emails
      - Returns: id, email, created_at, raw_user_meta_data
      
  2. Security
    - Function has SECURITY DEFINER (runs with elevated privileges)
    - Function checks caller is an approved admin before returning data
    - If not admin, returns empty array
*/

-- Create function to get all users (admin only)
CREATE OR REPLACE FUNCTION get_all_users_admin()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  raw_user_meta_data jsonb
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  caller_email text;
BEGIN
  -- Get the caller's email
  SELECT au.email INTO caller_email
  FROM auth.users au
  WHERE au.id = auth.uid();

  -- Check if caller is an approved admin
  IF caller_email NOT IN (
    'ipalominopc@gmail.com',
    'isaac@goflexconnect.com',
    'isaac@goflexcloud.com',
    'dev@goflexconnect.com'
  ) THEN
    -- Not an admin, return empty result
    RETURN;
  END IF;

  -- Admin approved, return all users
  RETURN QUERY
  SELECT 
    au.id,
    au.email::text,
    au.created_at,
    au.raw_user_meta_data
  FROM auth.users au
  ORDER BY au.created_at DESC;
END;
$$;
