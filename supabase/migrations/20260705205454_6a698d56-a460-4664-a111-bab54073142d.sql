-- Restrict SELECT on profiles.phone to owner only (revoke from anon+authenticated).
REVOKE SELECT (phone) ON public.profiles FROM anon, authenticated, PUBLIC;

-- Broaden live_messages SELECT so any authenticated viewer can read chat.
DROP POLICY IF EXISTS live_messages_select_participants ON public.live_messages;
CREATE POLICY live_messages_select_authenticated
  ON public.live_messages
  FOR SELECT
  TO authenticated
  USING (true);

-- Provide an owner-scoped way to read own phone (function bypasses column grant).
CREATE OR REPLACE FUNCTION public.get_own_phone()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT phone FROM public.profiles WHERE id = auth.uid()
$$;
GRANT EXECUTE ON FUNCTION public.get_own_phone() TO authenticated;