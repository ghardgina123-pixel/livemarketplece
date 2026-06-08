
-- 1) Demote extra admins; keep only the primary owner
DELETE FROM public.user_roles
WHERE role = 'admin'
  AND user_id <> (SELECT id FROM auth.users WHERE lower(email) = 'antoniogarciagarcia375@gmail.com' LIMIT 1);

-- 2) Replace the over-permissive admin-all policy with safer split policies
DROP POLICY IF EXISTS user_roles_admin_all ON public.user_roles;

CREATE POLICY user_roles_admin_select ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins may assign/remove ONLY non-admin roles. Promoting to admin requires service_role.
CREATE POLICY user_roles_admin_insert_non_admin ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND role <> 'admin');

CREATE POLICY user_roles_admin_delete_non_admin ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') AND role <> 'admin');

-- 3) Remove the wide-open Realtime subscribe policy. Existing
--    messages_select_participant still scopes message reads to conversation participants.
DROP POLICY IF EXISTS authenticated_can_subscribe ON public.messages;
