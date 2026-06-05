
-- Permitir lojista atualizar a propria assinatura ENQUANTO estiver pendente (para anexar comprovativo / metodo)
CREATE POLICY store_subs_update_owner_pending ON public.store_subscriptions
  FOR UPDATE TO authenticated
  USING (
    status = 'pending'
    AND EXISTS (SELECT 1 FROM stores s WHERE s.id = store_subscriptions.store_id AND s.owner_id = auth.uid())
  )
  WITH CHECK (
    status = 'pending'
    AND EXISTS (SELECT 1 FROM stores s WHERE s.id = store_subscriptions.store_id AND s.owner_id = auth.uid())
  );

-- Storage policies para o bucket subscription-proofs
-- Estrutura de path: {store_id}/{subscription_id}/{file}
CREATE POLICY "subscription_proofs_owner_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'subscription-proofs'
    AND EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.owner_id = auth.uid()
      AND s.id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "subscription_proofs_owner_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'subscription-proofs'
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR EXISTS (
        SELECT 1 FROM public.stores s
        WHERE s.owner_id = auth.uid()
        AND s.id::text = (storage.foldername(name))[1]
      )
    )
  );

CREATE POLICY "subscription_proofs_owner_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'subscription-proofs'
    AND EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.owner_id = auth.uid()
      AND s.id::text = (storage.foldername(name))[1]
    )
  );

-- Coluna opcional para motivo de rejeicao
ALTER TABLE public.store_subscriptions
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
