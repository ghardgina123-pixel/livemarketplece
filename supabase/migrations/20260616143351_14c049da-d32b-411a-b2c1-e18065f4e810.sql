-- 1) Restrict access to lives.livekit_room (internal room identifier)
REVOKE SELECT (livekit_room) ON public.lives FROM anon, authenticated;

-- 2) Align storage UPDATE policy for property-images with INSERT policy (property→agency→owner_id)
DROP POLICY IF EXISTS property_images_update_owner ON storage.objects;
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
          AND (storage.foldername(objects.name))[1] = p.id::text
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
          AND (storage.foldername(objects.name))[1] = p.id::text
      )
    )
  );