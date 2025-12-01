/*
  # Create admin function to fetch support tickets

  1. New Functions
    - `admin_get_support_tickets()` - Returns all support tickets with optional filters
      - Only callable by approved admin emails
      - Supports filtering by status, category, and search term
      - Returns tickets ordered by created_at DESC
      - Bypasses RLS with SECURITY DEFINER

  2. Security
    - Function has SECURITY DEFINER (runs with elevated privileges)
    - Checks caller is approved admin before returning data
    - Uses same admin list as other admin functions
    - If not admin, raises exception

  3. Parameters
    - p_status (text, nullable) - Filter by status
    - p_category (text, nullable) - Filter by category
    - p_search (text, nullable) - Search in email, name, subject, or message
*/

CREATE OR REPLACE FUNCTION admin_get_support_tickets(
  p_status text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_search text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  name text,
  email text,
  phone text,
  category text,
  subject text,
  message text,
  status text,
  priority text,
  source text,
  created_at timestamptz,
  updated_at timestamptz,
  last_admin_view timestamptz,
  last_admin_note text
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

  -- Admin approved, return filtered tickets
  RETURN QUERY
  SELECT
    st.id,
    st.user_id,
    st.name,
    st.email,
    st.phone,
    st.category,
    st.subject,
    st.message,
    st.status,
    st.priority,
    st.source,
    st.created_at,
    st.updated_at,
    st.last_admin_view,
    st.last_admin_note
  FROM support_tickets st
  WHERE
    (p_status IS NULL OR st.status = p_status)
    AND (p_category IS NULL OR st.category = p_category)
    AND (
      p_search IS NULL
      OR st.email ILIKE '%' || p_search || '%'
      OR st.name ILIKE '%' || p_search || '%'
      OR st.subject ILIKE '%' || p_search || '%'
      OR st.message ILIKE '%' || p_search || '%'
    )
  ORDER BY st.created_at DESC;
END;
$$;
