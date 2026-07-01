
-- 1) profiles.phone: revoke column read from anon/authenticated
REVOKE SELECT (phone) ON public.profiles FROM anon, authenticated;

-- 2) live_messages: restrict SELECT to authenticated
DROP POLICY IF EXISTS live_messages_select_all ON public.live_messages;
CREATE POLICY live_messages_select_auth ON public.live_messages
  FOR SELECT TO authenticated USING (true);

-- 3) orders: enforce pending status on customer inserts
DROP POLICY IF EXISTS orders_insert_customer ON public.orders;
CREATE POLICY orders_insert_customer ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid() AND status = 'pending'::order_status);

-- 4) product-videos storage: restrict SELECT to owning store
DROP POLICY IF EXISTS product_videos_read_auth ON storage.objects;
CREATE POLICY product_videos_read_owner ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'product-videos'
    AND EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.owner_id = auth.uid()
        AND s.id::text = (storage.foldername(objects.name))[1]
    )
  );
