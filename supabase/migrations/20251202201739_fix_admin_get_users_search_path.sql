/*
  # Fix admin_get_users_with_plans search path
  
  1. Changes
    - Add explicit schema search_path to function
    - Ensures function can access public schema tables
    
  2. Reason
    - SECURITY DEFINER functions may have restricted search_path
    - Explicitly setting search_path ensures access to public schema
*/

CREATE OR REPLACE FUNCTION admin_get_users_with_plans()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  plan_override text,
  plan_override_reason text,
  plan_override_expires_at timestamptz
)
SECURITY DEFINER
SET search_path = public
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
    RAISE EXCEPTION 'User not allowed';
  END IF;

  -- Admin approved, return all users with their plan data
  RETURN QUERY
  SELECT 
    au.id,
    au.email::text,
    au.created_at,
    p.plan_override,
    p.plan_override_reason,
    p.plan_override_expires_at
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.id = au.id
  ORDER BY au.created_at DESC;
END;
$$;
