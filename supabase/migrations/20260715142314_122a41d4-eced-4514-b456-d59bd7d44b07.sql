
ALTER TABLE public.store_subscriptions
  ADD CONSTRAINT store_subscriptions_store_id_fkey
  FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_store_subscriptions_store_id ON public.store_subscriptions(store_id);
CREATE INDEX IF NOT EXISTS idx_store_subscriptions_plan_status ON public.store_subscriptions(plan, status);

NOTIFY pgrst, 'reload schema';
