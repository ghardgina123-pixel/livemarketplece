
CREATE TABLE public.product_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  views INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.product_videos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.product_videos TO authenticated;
GRANT ALL ON public.product_videos TO service_role;
ALTER TABLE public.product_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY product_videos_select_public ON public.product_videos
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_videos.product_id AND p.status = 'approved')
  OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = product_videos.store_id AND s.owner_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);
CREATE POLICY product_videos_write_owner ON public.product_videos
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = product_videos.store_id AND s.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = product_videos.store_id AND s.owner_id = auth.uid()));

CREATE INDEX idx_product_videos_created ON public.product_videos(created_at DESC);

CREATE TABLE public.live_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  live_id UUID NOT NULL REFERENCES public.lives(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  text TEXT NOT NULL CHECK (char_length(text) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.live_messages TO anon, authenticated;
GRANT INSERT ON public.live_messages TO authenticated;
GRANT ALL ON public.live_messages TO service_role;
ALTER TABLE public.live_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY live_messages_select_all ON public.live_messages
FOR SELECT USING (true);
CREATE POLICY live_messages_insert_self ON public.live_messages
FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());

CREATE INDEX idx_live_messages_live ON public.live_messages(live_id, created_at);

ALTER PUBLICATION supabase_realtime ADD TABLE public.live_messages;
ALTER TABLE public.live_messages REPLICA IDENTITY FULL;
