
-- =========================================================================
-- 1) Rotate push webhook secret (invalidate leaked value from prior migration)
-- =========================================================================
DO $$
DECLARE v_new text;
BEGIN
  v_new := encode(gen_random_bytes(48), 'base64');
  IF EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'push_webhook_secret') THEN
    PERFORM vault.update_secret(
      (SELECT id FROM vault.secrets WHERE name = 'push_webhook_secret'),
      v_new,
      'push_webhook_secret'
    );
  ELSE
    PERFORM vault.create_secret(v_new, 'push_webhook_secret');
  END IF;
END $$;

-- =========================================================================
-- 2) Generic guard: block non-admin status changes on moderated tables
-- =========================================================================
CREATE OR REPLACE FUNCTION public.guard_status_admin_only()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'status_change_admin_only';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_guard_status_stores ON public.stores;
CREATE TRIGGER trg_guard_status_stores
BEFORE UPDATE OF status ON public.stores
FOR EACH ROW EXECUTE FUNCTION public.guard_status_admin_only();

DROP TRIGGER IF EXISTS trg_guard_status_agencies ON public.real_estate_agencies;
CREATE TRIGGER trg_guard_status_agencies
BEFORE UPDATE OF status ON public.real_estate_agencies
FOR EACH ROW EXECUTE FUNCTION public.guard_status_admin_only();

DROP TRIGGER IF EXISTS trg_guard_status_products ON public.products;
CREATE TRIGGER trg_guard_status_products
BEFORE UPDATE OF status ON public.products
FOR EACH ROW EXECUTE FUNCTION public.guard_status_admin_only();

DROP TRIGGER IF EXISTS trg_guard_status_properties ON public.properties;
CREATE TRIGGER trg_guard_status_properties
BEFORE UPDATE OF status ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.guard_status_admin_only();

DROP TRIGGER IF EXISTS trg_guard_status_couriers ON public.couriers;
CREATE TRIGGER trg_guard_status_couriers
BEFORE UPDATE OF status ON public.couriers
FOR EACH ROW EXECUTE FUNCTION public.guard_status_admin_only();

DROP TRIGGER IF EXISTS trg_guard_status_agency_live_fees ON public.agency_live_fees;
CREATE TRIGGER trg_guard_status_agency_live_fees
BEFORE UPDATE OF status ON public.agency_live_fees
FOR EACH ROW EXECUTE FUNCTION public.guard_status_admin_only();

DROP TRIGGER IF EXISTS trg_guard_status_store_subs ON public.store_subscriptions;
CREATE TRIGGER trg_guard_status_store_subs
BEFORE UPDATE OF status ON public.store_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.guard_status_admin_only();

-- =========================================================================
-- 3) Orders: sellers restricted to safe status transitions (never 'paid'/'delivered')
-- =========================================================================
CREATE OR REPLACE FUNCTION public.guard_order_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean := public.has_role(auth.uid(), 'admin'::app_role);
  v_is_seller boolean;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;
  IF v_is_admin THEN
    RETURN NEW;
  END IF;
  SELECT EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = NEW.store_id AND s.owner_id = auth.uid()
  ) INTO v_is_seller;
  IF v_is_seller THEN
    -- Seller may only advance fulfilment states; never mark paid/delivered themselves.
    IF NEW.status NOT IN ('preparing'::order_status, 'shipped'::order_status, 'cancelled'::order_status) THEN
      RAISE EXCEPTION 'order_status_not_allowed_for_seller';
    END IF;
    -- Do not allow paying orders through this path
    IF OLD.status = 'pending'::order_status AND NEW.status <> 'cancelled'::order_status THEN
      RAISE EXCEPTION 'seller_cannot_bypass_payment';
    END IF;
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'order_status_change_not_authorized';
END; $$;

DROP TRIGGER IF EXISTS trg_guard_order_status ON public.orders;
CREATE TRIGGER trg_guard_order_status
BEFORE UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.guard_order_status_transition();

-- =========================================================================
-- 4) Order items: lock parent order and re-check pending status at insert time
-- =========================================================================
CREATE OR REPLACE FUNCTION public.guard_order_items_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_status order_status; v_customer uuid;
BEGIN
  SELECT status, customer_id INTO v_status, v_customer
    FROM public.orders WHERE id = NEW.order_id FOR UPDATE;
  IF v_status IS NULL THEN RAISE EXCEPTION 'order_not_found'; END IF;
  IF v_customer <> auth.uid() AND NOT public.has_role(auth.uid(),'admin'::app_role) THEN
    RAISE EXCEPTION 'not_order_owner';
  END IF;
  IF v_status <> 'pending'::order_status THEN
    RAISE EXCEPTION 'order_not_pending';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_guard_order_items_insert ON public.order_items;
CREATE TRIGGER trg_guard_order_items_insert
BEFORE INSERT ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.guard_order_items_insert();

-- =========================================================================
-- 5) Realtime subscription: remove permissive policy on public.messages
-- =========================================================================
DROP POLICY IF EXISTS "authenticated_can_subscribe" ON public.messages;

-- =========================================================================
-- 6) Storage: property-images delete/update — validate against property_images row
-- =========================================================================
DROP POLICY IF EXISTS "property_images_delete_owner" ON storage.objects;
DROP POLICY IF EXISTS "property_images_update_owner" ON storage.objects;

CREATE POLICY "property_images_delete_owner"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-images'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1
      FROM public.property_images pi
      JOIN public.properties p ON p.id = pi.property_id
      JOIN public.real_estate_agencies a ON a.id = p.agency_id
      WHERE a.owner_id = auth.uid()
        AND (
          pi.image_url = storage.objects.name
          OR pi.image_url LIKE '%/' || storage.objects.name
          OR pi.image_url LIKE '%' || storage.objects.name
        )
    )
  )
);

CREATE POLICY "property_images_update_owner"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'property-images'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1
      FROM public.property_images pi
      JOIN public.properties p ON p.id = pi.property_id
      JOIN public.real_estate_agencies a ON a.id = p.agency_id
      WHERE a.owner_id = auth.uid()
        AND (
          pi.image_url = storage.objects.name
          OR pi.image_url LIKE '%/' || storage.objects.name
          OR pi.image_url LIKE '%' || storage.objects.name
        )
    )
  )
)
WITH CHECK (
  bucket_id = 'property-images'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1
      FROM public.property_images pi
      JOIN public.properties p ON p.id = pi.property_id
      JOIN public.real_estate_agencies a ON a.id = p.agency_id
      WHERE a.owner_id = auth.uid()
        AND (
          pi.image_url = storage.objects.name
          OR pi.image_url LIKE '%/' || storage.objects.name
          OR pi.image_url LIKE '%' || storage.objects.name
        )
    )
  )
);
