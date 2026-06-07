
-- Promote all existing users to admin (user requested immediate admin access)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users
ON CONFLICT (user_id, role) DO NOTHING;

-- Admin function: create a store manually for an existing user (by email)
CREATE OR REPLACE FUNCTION public.admin_create_store_for_email(
  _email text,
  _name text,
  _category text DEFAULT NULL,
  _phone text DEFAULT NULL,
  _activate boolean DEFAULT true
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_store uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  SELECT id INTO v_owner FROM auth.users WHERE lower(email) = lower(_email) LIMIT 1;
  IF v_owner IS NULL THEN RAISE EXCEPTION 'user_not_found'; END IF;

  INSERT INTO public.stores (owner_id, name, category, phone, status)
  VALUES (v_owner, _name, _category, _phone,
          CASE WHEN _activate THEN 'active'::store_status ELSE 'pending'::store_status END)
  RETURNING id INTO v_store;

  IF _activate THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_owner, 'seller'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN v_store;
END; $$;
