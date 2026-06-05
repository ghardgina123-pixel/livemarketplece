-- Function to approve a store: sets status to 'active' and grants 'seller' role to its owner
CREATE OR REPLACE FUNCTION public.admin_approve_store(_store_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  SELECT owner_id INTO v_owner FROM public.stores WHERE id = _store_id;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'store_not_found';
  END IF;

  UPDATE public.stores
    SET status = 'active'::store_status,
        rejection_reason = NULL,
        updated_at = now()
  WHERE id = _store_id;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_owner, 'seller'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Function to reject a store
CREATE OR REPLACE FUNCTION public.admin_reject_store(_store_id uuid, _reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  UPDATE public.stores
    SET status = 'rejected'::store_status,
        rejection_reason = COALESCE(_reason, 'Sem motivo informado'),
        updated_at = now()
  WHERE id = _store_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_approve_store(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_reject_store(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_approve_store(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reject_store(uuid, text) TO authenticated;