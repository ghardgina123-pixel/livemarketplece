
CREATE TABLE public.short_likes (
  video_id uuid NOT NULL REFERENCES public.product_videos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (video_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.short_likes TO authenticated;
GRANT SELECT ON public.short_likes TO anon;
GRANT ALL ON public.short_likes TO service_role;
ALTER TABLE public.short_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "short_likes_read" ON public.short_likes FOR SELECT USING (true);
CREATE POLICY "short_likes_insert_own" ON public.short_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "short_likes_delete_own" ON public.short_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX short_likes_video_idx ON public.short_likes(video_id);

CREATE TABLE public.short_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES public.product_videos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text text NOT NULL CHECK (char_length(text) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.short_comments TO authenticated;
GRANT SELECT ON public.short_comments TO anon;
GRANT ALL ON public.short_comments TO service_role;
ALTER TABLE public.short_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "short_comments_read" ON public.short_comments FOR SELECT USING (true);
CREATE POLICY "short_comments_insert_own" ON public.short_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "short_comments_delete_own" ON public.short_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX short_comments_video_idx ON public.short_comments(video_id, created_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.lives;
ALTER PUBLICATION supabase_realtime ADD TABLE public.short_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.short_comments;
