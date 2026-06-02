
-- Public read on both buckets
CREATE POLICY "store_assets_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'store-assets');
CREATE POLICY "product_images_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');

-- Authenticated owners write to their own folder ({uid}/file.ext)
CREATE POLICY "store_assets_owner_write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'store-assets' AND (storage.foldername(name))[1] = auth.uid()::text
);
CREATE POLICY "store_assets_owner_update" ON storage.objects FOR UPDATE TO authenticated USING (
  bucket_id = 'store-assets' AND (storage.foldername(name))[1] = auth.uid()::text
);
CREATE POLICY "store_assets_owner_delete" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'store-assets' AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "product_images_owner_write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text
);
CREATE POLICY "product_images_owner_update" ON storage.objects FOR UPDATE TO authenticated USING (
  bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text
);
CREATE POLICY "product_images_owner_delete" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text
);
