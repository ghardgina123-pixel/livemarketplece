GRANT DELETE ON public.lives TO authenticated;
CREATE POLICY "lives_delete_owner" ON public.lives FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.stores s WHERE s.id = lives.store_id AND s.owner_id = auth.uid())
);