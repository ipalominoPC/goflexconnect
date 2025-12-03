/*
  # Create function to get session events with user emails
  
  ## Problem
  Admin dashboard can't fetch user emails because auth.admin.getUserById requires service role
  
  ## Solution
  Create SECURITY DEFINER function that joins session_events with auth.users
  
  ## Changes
  - Create admin_get_session_events function
  - Returns session events with user emails
  - Only accessible to admin users
  - Accepts time range parameter
*/

CREATE OR REPLACE FUNCTION admin_get_session_events(
  from_timestamp timestamptz DEFAULT NOW() - INTERVAL '7 days',
  result_limit int DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  user_id uuid,
  event_type text,
  device_info text,
  ip_address text,
  metadata jsonb,
  user_email text
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
    'dev@goflexconnect.com'
  ) THEN
    RAISE EXCEPTION 'User not allowed';
  END IF;

  -- Return session events with user emails
  RETURN QUERY
  SELECT 
    se.id,
    se.created_at,
    se.user_id,
    se.event_type,
    se.device_info,
    se.ip_address,
    se.metadata,
    COALESCE(au.email, 'Unknown') as user_email
  FROM session_events se
  LEFT JOIN auth.users au ON au.id = se.user_id
  WHERE se.created_at >= from_timestamp
  ORDER BY se.created_at DESC
  LIMIT result_limit;
END;
$$;