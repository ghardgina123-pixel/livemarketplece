
-- live_viewers: presença ativa (heartbeat)
CREATE TABLE public.live_viewers (
  live_id uuid NOT NULL REFERENCES public.lives(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (live_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.live_viewers TO authenticated;
GRANT SELECT ON public.live_viewers TO anon;
GRANT ALL ON public.live_viewers TO service_role;
ALTER TABLE public.live_viewers ENABLE ROW LEVEL SECURITY;

CREATE POLICY live_viewers_select_all ON public.live_viewers FOR SELECT USING (true);
CREATE POLICY live_viewers_upsert_own ON public.live_viewers FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY live_viewers_update_own ON public.live_viewers FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY live_viewers_delete_own ON public.live_viewers FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX live_viewers_live_last_seen_idx ON public.live_viewers (live_id, last_seen_at DESC);

-- live_likes: coração / like por usuário
CREATE TABLE public.live_likes (
  live_id uuid NOT NULL REFERENCES public.lives(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (live_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.live_likes TO authenticated;
GRANT SELECT ON public.live_likes TO anon;
GRANT ALL ON public.live_likes TO service_role;
ALTER TABLE public.live_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY live_likes_select_all ON public.live_likes FOR SELECT USING (true);
CREATE POLICY live_likes_insert_own ON public.live_likes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY live_likes_delete_own ON public.live_likes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX live_likes_live_idx ON public.live_likes (live_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_viewers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_likes;
