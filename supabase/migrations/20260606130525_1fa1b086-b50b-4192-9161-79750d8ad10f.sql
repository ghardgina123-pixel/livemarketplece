
CREATE POLICY "property_images_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'property-images');
CREATE POLICY "property_images_insert_auth" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'property-images');
CREATE POLICY "property_images_update_owner" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'property-images' AND owner = auth.uid());
CREATE POLICY "property_images_delete_owner" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'property-images' AND owner = auth.uid());
