
-- Read: any signed-in user (Shorts feed playback via signed URL)
CREATE POLICY "product_videos_read_auth"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'product-videos');

-- Write/Update/Delete: only the store owner can manage files under <store_id>/...
CREATE POLICY "product_videos_insert_owner"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'product-videos'
  AND EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id::text = (storage.foldername(name))[1]
      AND s.owner_id = auth.uid()
  )
);

CREATE POLICY "product_videos_update_owner"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'product-videos'
  AND EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id::text = (storage.foldername(name))[1]
      AND s.owner_id = auth.uid()
  )
);

CREATE POLICY "product_videos_delete_owner"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'product-videos'
  AND EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id::text = (storage.foldername(name))[1]
      AND s.owner_id = auth.uid()
  )
);
