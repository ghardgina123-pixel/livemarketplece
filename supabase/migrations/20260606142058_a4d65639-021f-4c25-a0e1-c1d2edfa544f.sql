
-- 1) Remove overly-broad SELECT policy on public.messages
DROP POLICY IF EXISTS authenticated_can_subscribe ON public.messages;

-- 2) Replace open storage INSERT policy with owner-scoped check
DROP POLICY IF EXISTS property_images_insert_auth ON storage.objects;
CREATE POLICY property_images_insert_owner ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'property-images'
  AND EXISTS (
    SELECT 1
    FROM public.properties p
    JOIN public.real_estate_agencies a ON a.id = p.agency_id
    WHERE a.owner_id = auth.uid()
      AND split_part(storage.objects.name, '/', 1) = p.id::text
  )
);

-- 3) Hide sensitive payment_methods.config from public/anon/authenticated readers
REVOKE SELECT ON public.payment_methods FROM anon, authenticated;
GRANT SELECT (
  id, country_code, currency_code, currency_symbol, method_type,
  display_name, description, icon, is_active, requires_proof_upload,
  is_cash_on_delivery, sort_order, created_at, updated_at
) ON public.payment_methods TO anon, authenticated;

-- 4) Hide NIF on real_estate_agencies from anonymous readers
REVOKE SELECT ON public.real_estate_agencies FROM anon;
GRANT SELECT (
  id, owner_id, name, description, logo_url, cover_url, phone, email,
  province_id, municipality_id, district, street, lat, lng, status,
  rejection_reason, created_at, updated_at
) ON public.real_estate_agencies TO anon;
