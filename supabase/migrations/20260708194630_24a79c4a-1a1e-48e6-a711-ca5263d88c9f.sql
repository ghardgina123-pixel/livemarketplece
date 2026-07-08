DROP POLICY IF EXISTS live_messages_select_authenticated ON public.live_messages;
CREATE POLICY live_messages_select_active_live ON public.live_messages
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.lives l WHERE l.id = live_messages.live_id AND l.status = 'live'));