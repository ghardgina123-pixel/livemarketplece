
CREATE TABLE public.store_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  plan TEXT NOT NULL DEFAULT 'crm',
  status TEXT NOT NULL DEFAULT 'pending',
  price_aoa NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method TEXT,
  proof_url TEXT,
  started_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.store_subscriptions TO authenticated;
GRANT ALL ON public.store_subscriptions TO service_role;

ALTER TABLE public.store_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY store_subs_select_owner_or_admin ON public.store_subscriptions
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM stores s WHERE s.id = store_subscriptions.store_id AND s.owner_id = auth.uid())
  );

CREATE POLICY store_subs_insert_owner ON public.store_subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM stores s WHERE s.id = store_subscriptions.store_id AND s.owner_id = auth.uid())
  );

CREATE POLICY store_subs_update_admin ON public.store_subscriptions
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_store_subs_updated_at
  BEFORE UPDATE ON public.store_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_store_subs_store ON public.store_subscriptions(store_id);
