
-- ============ 1) DELIVERIES + GPS TRACKING ============
CREATE TABLE IF NOT EXISTS public.deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  courier_id uuid REFERENCES public.couriers(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','packaging','in_transit','delivered','cancelled')),
  pickup_lat numeric,
  pickup_lng numeric,
  dropoff_lat numeric,
  dropoff_lng numeric,
  assigned_at timestamptz,
  picked_up_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.deliveries TO authenticated;
GRANT ALL ON public.deliveries TO service_role;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

-- Helpers
CREATE OR REPLACE FUNCTION public.is_delivery_participant(_delivery_id uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.deliveries d
    LEFT JOIN public.orders o ON o.id = d.order_id
    LEFT JOIN public.couriers c ON c.id = d.courier_id
    WHERE d.id = _delivery_id
      AND (o.customer_id = _user OR c.user_id = _user)
  )
$$;

CREATE OR REPLACE FUNCTION public.is_delivery_courier(_delivery_id uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.deliveries d
    JOIN public.couriers c ON c.id = d.courier_id
    WHERE d.id = _delivery_id AND c.user_id = _user
  )
$$;

CREATE POLICY deliveries_select_participant ON public.deliveries FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id=deliveries.order_id AND o.customer_id=auth.uid())
  OR EXISTS (SELECT 1 FROM public.couriers c WHERE c.id=deliveries.courier_id AND c.user_id=auth.uid())
  OR EXISTS (SELECT 1 FROM public.orders o JOIN public.stores s ON s.id=o.store_id WHERE o.id=deliveries.order_id AND s.owner_id=auth.uid())
);
CREATE POLICY deliveries_update_courier ON public.deliveries FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.couriers c WHERE c.id=deliveries.courier_id AND c.user_id=auth.uid())
) WITH CHECK (true);
CREATE POLICY deliveries_admin_write ON public.deliveries FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_deliveries_updated BEFORE UPDATE ON public.deliveries
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Tracking (GPS pings)
CREATE TABLE IF NOT EXISTS public.delivery_tracking (
  id bigserial PRIMARY KEY,
  delivery_id uuid NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_delivery ON public.delivery_tracking(delivery_id, updated_at DESC);
GRANT SELECT, INSERT ON public.delivery_tracking TO authenticated;
GRANT USAGE ON SEQUENCE public.delivery_tracking_id_seq TO authenticated;
GRANT ALL ON public.delivery_tracking TO service_role;
ALTER TABLE public.delivery_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY tracking_select_participant ON public.delivery_tracking FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.is_delivery_participant(delivery_id, auth.uid()));

CREATE POLICY tracking_insert_courier ON public.delivery_tracking FOR INSERT TO authenticated
WITH CHECK (public.is_delivery_courier(delivery_id, auth.uid()));

-- Purge tracking on delivery
CREATE OR REPLACE FUNCTION public.purge_delivery_tracking()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.status = 'delivered' AND (OLD.status IS DISTINCT FROM 'delivered') THEN
    DELETE FROM public.delivery_tracking WHERE delivery_id = NEW.id;
    NEW.delivered_at := COALESCE(NEW.delivered_at, now());
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_purge_delivery_tracking BEFORE UPDATE ON public.deliveries
FOR EACH ROW EXECUTE FUNCTION public.purge_delivery_tracking();

ALTER PUBLICATION supabase_realtime ADD TABLE public.deliveries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_tracking;

-- ============ 2) NOTIFICATIONS ============
-- Global broadcast (all authenticated read)
CREATE TABLE IF NOT EXISTS public.global_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  title text NOT NULL,
  body text,
  url text,
  ref_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_global_notifications_created ON public.global_notifications(created_at DESC);
GRANT SELECT ON public.global_notifications TO authenticated;
GRANT ALL ON public.global_notifications TO service_role;
ALTER TABLE public.global_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY globals_read_all_auth ON public.global_notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY globals_admin_write ON public.global_notifications FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
ALTER PUBLICATION supabase_realtime ADD TABLE public.global_notifications;

-- Admin queue (critical events)
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  subject text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  emailed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created ON public.admin_notifications(created_at DESC);
GRANT SELECT, UPDATE ON public.admin_notifications TO authenticated;
GRANT ALL ON public.admin_notifications TO service_role;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_notif_admin_only ON public.admin_notifications FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;

-- Per-user notifications (offline-store alerts land here for the storeowner)
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  title text NOT NULL,
  body text,
  url text,
  ref_id uuid,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_notif_user ON public.user_notifications(user_id, created_at DESC);
GRANT SELECT, UPDATE ON public.user_notifications TO authenticated;
GRANT ALL ON public.user_notifications TO service_role;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_notif_owner ON public.user_notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY user_notif_owner_update ON public.user_notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;

-- Push subscriptions (Web Push VAPID)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_push_subs_user ON public.push_subscriptions(user_id);
GRANT SELECT, INSERT, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY push_owner_all ON public.push_subscriptions FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============ 3) STORE ONLINE STATUS ============
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS is_online boolean NOT NULL DEFAULT false;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

-- Trigger: when a message is inserted addressed to a store owner who is offline,
-- create a user_notification for that owner.
CREATE OR REPLACE FUNCTION public.notify_offline_store_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_owner uuid; v_store_id uuid; v_online boolean;
BEGIN
  -- conversations table has store_id; join to find owner
  SELECT s.owner_id, s.id, s.is_online
    INTO v_owner, v_store_id, v_online
  FROM public.conversations cv
  JOIN public.stores s ON s.id = cv.store_id
  WHERE cv.id = NEW.conversation_id
  LIMIT 1;

  IF v_owner IS NOT NULL AND v_owner <> NEW.sender_id AND COALESCE(v_online,false) = false THEN
    INSERT INTO public.user_notifications (user_id, kind, title, body, url, ref_id)
    VALUES (v_owner, 'chat_offline', 'Nova mensagem enquanto offline', left(coalesce(NEW.body,''),140), '/chat', NEW.conversation_id);
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_notify_offline_store ON public.messages;
CREATE TRIGGER trg_notify_offline_store AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.notify_offline_store_owner();

-- ============ 4) BROADCASTS + ADMIN ALERTS ============
CREATE OR REPLACE FUNCTION public.broadcast_new_store()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  -- Admin alert on any new store submission
  INSERT INTO public.admin_notifications (kind, subject, payload)
  VALUES ('store.created','Nova loja registrada', jsonb_build_object('store_id',NEW.id,'name',NEW.name,'owner_id',NEW.owner_id));

  -- Public broadcast only when active
  IF NEW.status = 'active' THEN
    INSERT INTO public.global_notifications (kind, title, body, url, ref_id)
    VALUES ('store.new','Nova loja na Live Market', NEW.name, '/loja/'||NEW.id::text, NEW.id);
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_broadcast_new_store ON public.stores;
CREATE TRIGGER trg_broadcast_new_store AFTER INSERT ON public.stores
FOR EACH ROW EXECUTE FUNCTION public.broadcast_new_store();

CREATE OR REPLACE FUNCTION public.broadcast_store_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.status = 'active' AND OLD.status IS DISTINCT FROM 'active' THEN
    INSERT INTO public.global_notifications (kind, title, body, url, ref_id)
    VALUES ('store.new','Nova loja na Live Market', NEW.name, '/loja/'||NEW.id::text, NEW.id);
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_broadcast_store_status ON public.stores;
CREATE TRIGGER trg_broadcast_store_status AFTER UPDATE OF status ON public.stores
FOR EACH ROW EXECUTE FUNCTION public.broadcast_store_status();

CREATE OR REPLACE FUNCTION public.broadcast_new_product()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_name text;
BEGIN
  IF NEW.status = 'approved' AND (TG_OP='INSERT' OR OLD.status IS DISTINCT FROM 'approved') THEN
    SELECT name INTO v_name FROM public.stores WHERE id = NEW.store_id;
    INSERT INTO public.global_notifications (kind, title, body, url, ref_id)
    VALUES ('product.new','Novo produto disponível', COALESCE(v_name,'') || ' publicou "' || NEW.title || '"', '/produto/'||NEW.id::text, NEW.id);
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_broadcast_new_product ON public.products;
CREATE TRIGGER trg_broadcast_new_product AFTER INSERT OR UPDATE OF status ON public.products
FOR EACH ROW EXECUTE FUNCTION public.broadcast_new_product();

-- Admin alerts on cancellations / pending payouts
CREATE OR REPLACE FUNCTION public.alert_admin_on_order_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' THEN
    INSERT INTO public.admin_notifications (kind, subject, payload)
    VALUES ('order.cancelled','Pedido cancelado', jsonb_build_object('order_id',NEW.id,'store_id',NEW.store_id,'customer_id',NEW.customer_id));
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_alert_admin_order ON public.orders;
CREATE TRIGGER trg_alert_admin_order AFTER UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.alert_admin_on_order_change();
