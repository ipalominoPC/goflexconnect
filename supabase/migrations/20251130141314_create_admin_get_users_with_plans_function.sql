/*
  # Create admin function to list users with plan details
  
  1. New Functions
    - `admin_get_users_with_plans()` - Returns all users with profile and plan data
      - Only callable by approved admin emails
      - Returns: id, email, created_at, plan_override, plan_override_reason, plan_override_expires_at
      - Bypasses RLS with SECURITY DEFINER
      
  2. Security
    - Function has SECURITY DEFINER (runs with elevated privileges)
    - Checks caller is approved admin before returning data
    - Uses same admin list as other admin functions
    - If not admin, raises exception with clear message
    
  3. Admin Email List (centralized)
    - ipalominopc@gmail.com
    - isaac@goflexconnect.com
    - isaac@goflexcloud.com
    - dev@goflexconnect.com
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
LANGUAGE plpgsql
AS $$
DECLARE
  caller_email text;
BEGIN
  -- Get the caller's email
  SELECT au.email INTO caller_email
  FROM auth.users au
  WHERE au.id = auth.uid();

  -- Check if caller is an approved admin (same list as other admin functions)
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
  LEFT JOIN profiles p ON p.id = au.id
  ORDER BY au.created_at DESC;
END;
$$;
