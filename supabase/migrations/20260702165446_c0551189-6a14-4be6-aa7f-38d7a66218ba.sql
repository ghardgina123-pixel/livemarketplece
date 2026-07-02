
-- 1) live_messages: restrict SELECT
DROP POLICY IF EXISTS live_messages_select_auth ON public.live_messages;
CREATE POLICY live_messages_select_participants ON public.live_messages
  FOR SELECT TO authenticated
  USING (
    sender_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.lives l
      JOIN public.stores s ON s.id = l.store_id
      WHERE l.id = live_messages.live_id AND s.owner_id = auth.uid()
    )
  );

-- 2) property_visit_requests: restrict update fields via trigger
CREATE OR REPLACE FUNCTION public.protect_visit_request_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.property_id IS DISTINCT FROM OLD.property_id
     OR NEW.customer_id IS DISTINCT FROM OLD.customer_id
     OR NEW.contact_phone IS DISTINCT FROM OLD.contact_phone
     OR NEW.preferred_date IS DISTINCT FROM OLD.preferred_date
     OR NEW.preferred_time IS DISTINCT FROM OLD.preferred_time
     OR NEW.message IS DISTINCT FROM OLD.message THEN
    RAISE EXCEPTION 'agency_owner_can_only_change_status';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_visit_request_fields ON public.property_visit_requests;
CREATE TRIGGER trg_protect_visit_request_fields
  BEFORE UPDATE ON public.property_visit_requests
  FOR EACH ROW EXECUTE FUNCTION public.protect_visit_request_fields();

-- 3) product-videos storage: allow public read for active stores' videos
CREATE POLICY product_videos_read_public ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (
    bucket_id = 'product-videos'
    AND EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.status = 'active'::store_status
        AND s.id::text = (storage.foldername(objects.name))[1]
    )
  );
