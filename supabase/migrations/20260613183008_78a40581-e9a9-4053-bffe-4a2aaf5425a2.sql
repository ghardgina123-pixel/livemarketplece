
-- 1) Revoke accidental admin grants; keep only the oldest user (project owner) as admin
DELETE FROM public.user_roles
WHERE role = 'admin'::app_role
  AND user_id <> (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1);

-- 2) agency_live_fees: owners can only INSERT pending fees with NULL approved_at and default amount
ALTER POLICY agency_live_fees_insert_owner ON public.agency_live_fees
  WITH CHECK (
    status = 'pending'::agency_live_fee_status
    AND approved_at IS NULL
    AND amount_aoa = 5000
    AND EXISTS (
      SELECT 1 FROM public.real_estate_agencies a
      WHERE a.id = agency_live_fees.agency_id AND a.owner_id = auth.uid()
    )
  );

-- 3) store_subscriptions: owners can only INSERT pending subscriptions
ALTER POLICY store_subs_insert_owner ON public.store_subscriptions
  WITH CHECK (
    status = 'pending'
    AND EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_subscriptions.store_id AND s.owner_id = auth.uid()
    )
  );

-- 4) stores: prevent owner self-activation
ALTER POLICY stores_update_own_or_admin ON public.stores
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR (owner_id = auth.uid() AND status <> 'active'::store_status)
  );

-- 5) real_estate_agencies: prevent owner self-activation
ALTER POLICY agencies_update_own_or_admin ON public.real_estate_agencies
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR (owner_id = auth.uid() AND status <> 'active')
  );

-- 6) products: prevent seller self-approval
ALTER POLICY products_update_owner_or_admin ON public.products
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR (
      EXISTS (SELECT 1 FROM public.stores s WHERE s.id = products.store_id AND s.owner_id = auth.uid())
      AND status <> 'approved'::product_status
    )
  );

-- 7) properties: prevent agency self-approval/publication
ALTER POLICY properties_update_owner_or_admin ON public.properties
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR (
      EXISTS (SELECT 1 FROM public.real_estate_agencies a WHERE a.id = properties.agency_id AND a.owner_id = auth.uid())
      AND status NOT IN ('approved'::property_status, 'sold'::property_status, 'rented'::property_status)
    )
  );

-- 8) couriers: prevent self-activation
ALTER POLICY couriers_update_own_or_admin ON public.couriers
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR (user_id = auth.uid() AND status <> 'active'::courier_status)
  );

-- 9) orders: restrict seller updates (no status='paid' / no total change by seller)
ALTER POLICY orders_update_seller_or_admin ON public.orders
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = orders.store_id AND s.owner_id = auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR (
      EXISTS (SELECT 1 FROM public.stores s WHERE s.id = orders.store_id AND s.owner_id = auth.uid())
      AND status <> 'paid'
    )
  );

-- 10) order_items: only allow insert on pending orders (defense-in-depth; primary path is RPC)
ALTER POLICY order_items_insert_own ON public.order_items
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.customer_id = auth.uid()
        AND o.status = 'pending'
    )
  );

-- 11) Storage: fix broken property_images delete policy (was referencing agency name instead of object path)
DROP POLICY IF EXISTS property_images_delete_owner ON storage.objects;
CREATE POLICY property_images_delete_owner ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'property-images'
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR EXISTS (
        SELECT 1 FROM public.properties p
        JOIN public.real_estate_agencies a ON a.id = p.agency_id
        WHERE a.owner_id = auth.uid()
          AND (storage.foldername(objects.name))[1] = (p.id)::text
      )
    )
  );

-- 12) Fix mutable search_path on email helper functions
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
