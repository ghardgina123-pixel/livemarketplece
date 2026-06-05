
-- =========================================================
-- A. Move sensitive store fields into store_private
-- =========================================================
CREATE TABLE IF NOT EXISTS public.store_private (
  store_id uuid PRIMARY KEY REFERENCES public.stores(id) ON DELETE CASCADE,
  nif text,
  bank_name text,
  bank_account text,
  bank_holder text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_private TO authenticated;
GRANT ALL ON public.store_private TO service_role;

ALTER TABLE public.store_private ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS store_private_owner_or_admin_select ON public.store_private;
CREATE POLICY store_private_owner_or_admin_select ON public.store_private
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_private.store_id AND s.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS store_private_owner_insert ON public.store_private;
CREATE POLICY store_private_owner_insert ON public.store_private
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_private.store_id AND s.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS store_private_owner_update ON public.store_private;
CREATE POLICY store_private_owner_update ON public.store_private
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_private.store_id AND s.owner_id = auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_private.store_id AND s.owner_id = auth.uid())
  );

DROP TRIGGER IF EXISTS store_private_set_updated_at ON public.store_private;
CREATE TRIGGER store_private_set_updated_at
  BEFORE UPDATE ON public.store_private
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Backfill from existing stores columns
INSERT INTO public.store_private (store_id, nif, bank_name, bank_account, bank_holder)
SELECT id, nif, bank_name, bank_account, bank_holder
  FROM public.stores
 WHERE nif IS NOT NULL OR bank_name IS NOT NULL OR bank_account IS NOT NULL OR bank_holder IS NOT NULL
ON CONFLICT (store_id) DO NOTHING;

-- Drop sensitive columns from stores
ALTER TABLE public.stores
  DROP COLUMN IF EXISTS nif,
  DROP COLUMN IF EXISTS bank_name,
  DROP COLUMN IF EXISTS bank_account,
  DROP COLUMN IF EXISTS bank_holder;

-- =========================================================
-- B. profiles: hide phone from anonymous visitors via column grants
-- =========================================================
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (id, display_name, avatar_url, country_code, created_at, updated_at) ON public.profiles TO anon;

-- =========================================================
-- C. Fix broken storage policies (product-videos, subscription-proofs)
-- =========================================================
DROP POLICY IF EXISTS product_videos_insert_owner ON storage.objects;
DROP POLICY IF EXISTS product_videos_update_owner ON storage.objects;
DROP POLICY IF EXISTS product_videos_delete_owner ON storage.objects;
DROP POLICY IF EXISTS subscription_proofs_owner_insert ON storage.objects;
DROP POLICY IF EXISTS subscription_proofs_owner_update ON storage.objects;
DROP POLICY IF EXISTS subscription_proofs_owner_select ON storage.objects;

CREATE POLICY product_videos_insert_owner ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-videos' AND EXISTS (
      SELECT 1 FROM public.stores s
       WHERE s.owner_id = auth.uid()
         AND s.id::text = (storage.foldername(storage.objects.name))[1]
    )
  );

CREATE POLICY product_videos_update_owner ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'product-videos' AND EXISTS (
      SELECT 1 FROM public.stores s
       WHERE s.owner_id = auth.uid()
         AND s.id::text = (storage.foldername(storage.objects.name))[1]
    )
  );

CREATE POLICY product_videos_delete_owner ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'product-videos' AND EXISTS (
      SELECT 1 FROM public.stores s
       WHERE s.owner_id = auth.uid()
         AND s.id::text = (storage.foldername(storage.objects.name))[1]
    )
  );

CREATE POLICY subscription_proofs_owner_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'subscription-proofs' AND EXISTS (
      SELECT 1 FROM public.stores s
       WHERE s.owner_id = auth.uid()
         AND s.id::text = (storage.foldername(storage.objects.name))[1]
    )
  );

CREATE POLICY subscription_proofs_owner_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'subscription-proofs' AND EXISTS (
      SELECT 1 FROM public.stores s
       WHERE s.owner_id = auth.uid()
         AND s.id::text = (storage.foldername(storage.objects.name))[1]
    )
  );

CREATE POLICY subscription_proofs_owner_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'subscription-proofs' AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR EXISTS (
        SELECT 1 FROM public.stores s
         WHERE s.owner_id = auth.uid()
           AND s.id::text = (storage.foldername(storage.objects.name))[1]
      )
    )
  );

-- =========================================================
-- D. realtime.messages: add restrictive policy (deny anon, allow authenticated)
--    Payload contents remain protected by RLS on each source table.
-- =========================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
             WHERE n.nspname='realtime' AND c.relname='messages') THEN
    EXECUTE 'ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS authenticated_can_subscribe ON realtime.messages';
    EXECUTE $p$CREATE POLICY authenticated_can_subscribe ON realtime.messages
      FOR SELECT TO authenticated USING (true)$p$;
  END IF;
END $$;

-- =========================================================
-- E. Lock down trigger-only SECURITY DEFINER functions
-- =========================================================
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bump_conversation_last_message() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_payout_on_paid() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- Revoke anon execute on admin RPCs (still callable by authenticated; functions themselves check role)
REVOKE EXECUTE ON FUNCTION public.admin_approve_store(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_reject_store(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_order_with_items(uuid, uuid, jsonb, text) FROM PUBLIC, anon;
