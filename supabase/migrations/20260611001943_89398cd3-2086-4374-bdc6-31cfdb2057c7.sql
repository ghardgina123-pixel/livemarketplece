
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS signup_fee_required boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.approved_stores_count()
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int FROM public.stores WHERE status = 'active'::store_status
$$;

CREATE OR REPLACE FUNCTION public.seller_signup_status()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'approved_count', public.approved_stores_count(),
    'free_slots_total', 50,
    'slots_left', GREATEST(0, 50 - public.approved_stores_count()),
    'fee_required', public.approved_stores_count() >= 50,
    'fee_aoa', 9600
  )
$$;

GRANT EXECUTE ON FUNCTION public.approved_stores_count() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.seller_signup_status() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.enforce_signup_fee()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
  v_has_sub boolean;
BEGIN
  v_count := public.approved_stores_count();
  IF v_count < 50 THEN
    NEW.signup_fee_required := false;
    RETURN NEW;
  END IF;
  NEW.signup_fee_required := true;
  SELECT EXISTS(
    SELECT 1 FROM public.store_subscriptions ss
    JOIN public.stores s2 ON s2.id = ss.store_id
    WHERE s2.owner_id = NEW.owner_id
      AND ss.plan = 'signup_fee'
      AND ss.status IN ('pending','approved','active')
  ) INTO v_has_sub;
  IF NOT v_has_sub THEN
    RAISE EXCEPTION 'signup_fee_required'
      USING HINT = 'As 50 vagas gratuitas foram preenchidas. Envie o comprovativo da taxa de inscrição (9.600 AOA) antes de registar a loja.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_stores_enforce_signup_fee ON public.stores;
CREATE TRIGGER trg_stores_enforce_signup_fee
  BEFORE INSERT ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.enforce_signup_fee();
