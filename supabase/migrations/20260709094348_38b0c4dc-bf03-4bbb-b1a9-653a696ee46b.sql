
-- Realtime for tables not yet in publication
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.deliveries; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.messages; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- Presence columns on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_online boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

-- Ensure tracking policies exist
DROP POLICY IF EXISTS "courier can insert tracking" ON public.delivery_tracking;
CREATE POLICY "courier can insert tracking"
  ON public.delivery_tracking FOR INSERT TO authenticated
  WITH CHECK (public.is_delivery_courier(delivery_id, auth.uid()));

DROP POLICY IF EXISTS "participants can read tracking" ON public.delivery_tracking;
CREATE POLICY "participants can read tracking"
  ON public.delivery_tracking FOR SELECT TO authenticated
  USING (public.is_delivery_participant(delivery_id, auth.uid()));

-- RPC: lojista cria entrega para um pedido
CREATE OR REPLACE FUNCTION public.seller_create_delivery(_order_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE v_owner uuid; v_del uuid;
BEGIN
  SELECT s.owner_id INTO v_owner
    FROM public.orders o JOIN public.stores s ON s.id = o.store_id
    WHERE o.id = _order_id;
  IF v_owner IS NULL OR v_owner <> auth.uid() THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  SELECT id INTO v_del FROM public.deliveries WHERE order_id = _order_id;
  IF v_del IS NULL THEN
    INSERT INTO public.deliveries (order_id, status) VALUES (_order_id, 'pending')
      RETURNING id INTO v_del;
    UPDATE public.orders SET status = 'shipped' WHERE id = _order_id AND status IN ('paid','preparing');
  END IF;
  RETURN v_del;
END $$;

GRANT EXECUTE ON FUNCTION public.seller_create_delivery(uuid) TO authenticated;

-- Payment intents (Multicaixa Express)
CREATE TABLE IF NOT EXISTS public.payment_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'multicaixa_express',
  amount_aoa numeric(12,2) NOT NULL,
  store_amount_aoa numeric(12,2) NOT NULL,
  platform_fee_aoa numeric(12,2) NOT NULL,
  commission_pct numeric(5,2) NOT NULL DEFAULT 10.00,
  reference text,
  external_id text,
  status text NOT NULL DEFAULT 'pending',
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.payment_intents TO authenticated;
GRANT ALL ON public.payment_intents TO service_role;
ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customer or seller reads intent" ON public.payment_intents;
CREATE POLICY "customer or seller reads intent" ON public.payment_intents FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.orders o LEFT JOIN public.stores s ON s.id = o.store_id
  WHERE o.id = payment_intents.order_id AND (o.customer_id = auth.uid() OR s.owner_id = auth.uid())
));

DROP POLICY IF EXISTS "customer creates intent" ON public.payment_intents;
CREATE POLICY "customer creates intent" ON public.payment_intents FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.customer_id = auth.uid()));

DROP TRIGGER IF EXISTS payment_intents_set_updated_at ON public.payment_intents;
CREATE TRIGGER payment_intents_set_updated_at BEFORE UPDATE ON public.payment_intents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
