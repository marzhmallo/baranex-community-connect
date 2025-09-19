-- Create function to get user sessions
CREATE OR REPLACE FUNCTION public.get_user_sessions()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  factor_id uuid,
  aal text,
  not_after timestamptz,
  user_agent text,
  ip text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth
AS $$
BEGIN
  RETURN QUERY 
  SELECT 
    s.id,
    s.user_id,
    s.created_at,
    s.updated_at,
    s.factor_id,
    s.aal,
    s.not_after,
    s.user_agent,
    s.ip::text
  FROM auth.sessions s
  WHERE s.user_id = auth.uid()
  ORDER BY s.created_at DESC;
END;
$$;

-- Create function to delete other user sessions (keep current one)
CREATE OR REPLACE FUNCTION public.delete_user_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth
AS $$
DECLARE
  current_session_id uuid;
BEGIN
  -- Get the current session ID from the JWT
  SELECT id INTO current_session_id 
  FROM auth.sessions 
  WHERE user_id = auth.uid() 
  ORDER BY created_at DESC 
  LIMIT 1;

  -- Delete all other sessions for this user
  DELETE FROM auth.sessions 
  WHERE user_id = auth.uid() 
  AND id != COALESCE(current_session_id, '00000000-0000-0000-0000-000000000000'::uuid);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_sessions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_sessions() TO authenticated;