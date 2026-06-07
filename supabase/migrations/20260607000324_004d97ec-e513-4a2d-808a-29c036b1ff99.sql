
-- 1) profiles: restrict anon SELECT to non-sensitive columns (exclude phone)
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (id, display_name, avatar_url, country_code, created_at, updated_at) ON public.profiles TO anon;

-- 2) payment_methods: ensure config (bank details) is not exposed to anon/authenticated
REVOKE SELECT ON public.payment_methods FROM anon, authenticated;
GRANT SELECT (id, display_name, country_code, currency_code, currency_symbol, method_type, description, icon, is_active, requires_proof_upload, is_cash_on_delivery, sort_order, created_at, updated_at) ON public.payment_methods TO anon, authenticated;

-- 3) storage: allow agency owners (and admins) to delete their property images
DROP POLICY IF EXISTS "property_images_delete_owner" ON storage.objects;
CREATE POLICY "property_images_delete_owner" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'property-images'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR EXISTS (
        SELECT 1 FROM public.real_estate_agencies a
        WHERE a.owner_id = auth.uid()
          AND (storage.foldername(name))[1] IN (
            SELECT p.id::text FROM public.properties p WHERE p.agency_id = a.id
          )
      )
    )
  );

-- Also allow owners to delete their own subscription proofs (and admins)
DROP POLICY IF EXISTS "subscription_proofs_delete_owner" ON storage.objects;
CREATE POLICY "subscription_proofs_delete_owner" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'subscription-proofs'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR owner = auth.uid()
    )
  );
