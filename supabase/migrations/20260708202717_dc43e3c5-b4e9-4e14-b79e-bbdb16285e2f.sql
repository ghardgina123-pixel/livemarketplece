
-- 1) Hide livekit_room from anon/authenticated (column-level).
REVOKE SELECT (livekit_room) ON public.lives FROM anon, authenticated;

-- 2) Normalize property-images storage ownership checks to use split_part,
--    matching the INSERT policy exactly (folder prefix == property id).
DROP POLICY IF EXISTS property_images_delete_owner ON storage.objects;
DROP POLICY IF EXISTS property_images_update_owner ON storage.objects;

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
        AND split_part(objects.name, '/', 1) = p.id::text
    )
  )
);

CREATE POLICY property_images_update_owner ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'property-images'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.properties p
      JOIN public.real_estate_agencies a ON a.id = p.agency_id
      WHERE a.owner_id = auth.uid()
        AND split_part(objects.name, '/', 1) = p.id::text
    )
  )
)
WITH CHECK (
  bucket_id = 'property-images'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.properties p
      JOIN public.real_estate_agencies a ON a.id = p.agency_id
      WHERE a.owner_id = auth.uid()
        AND split_part(objects.name, '/', 1) = p.id::text
    )
  )
);
