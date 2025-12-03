/*
  # Fix admin_get_support_tickets to include ticket_number

  1. Changes
    - Update the admin_get_support_tickets function to return ticket_number column
    - This allows the Support Inbox to display ticket numbers properly

  2. Security
    - Maintains existing SECURITY DEFINER and admin checks
    - No changes to security model
*/

CREATE OR REPLACE FUNCTION admin_get_support_tickets(
  p_status text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_search text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  ticket_number text,
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

  -- Check if caller is an approved admin
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
    st.ticket_number,
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
      OR st.ticket_number ILIKE '%' || p_search || '%'
    )
  ORDER BY st.created_at DESC;
END;
$$;