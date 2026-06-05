
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (customer_id, store_id)
);
GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY conversations_select_participant ON public.conversations
FOR SELECT TO authenticated
USING (
  customer_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = conversations.store_id AND s.owner_id = auth.uid())
);
CREATE POLICY conversations_insert_customer ON public.conversations
FOR INSERT TO authenticated
WITH CHECK (customer_id = auth.uid());
CREATE POLICY conversations_update_participant ON public.conversations
FOR UPDATE TO authenticated
USING (
  customer_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = conversations.store_id AND s.owner_id = auth.uid())
);

CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  text TEXT NOT NULL CHECK (char_length(text) BETWEEN 1 AND 4000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY messages_select_participant ON public.messages
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    LEFT JOIN public.stores s ON s.id = c.store_id
    WHERE c.id = messages.conversation_id
      AND (c.customer_id = auth.uid() OR s.owner_id = auth.uid())
  )
);
CREATE POLICY messages_insert_participant ON public.messages
FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    LEFT JOIN public.stores s ON s.id = c.store_id
    WHERE c.id = messages.conversation_id
      AND (c.customer_id = auth.uid() OR s.owner_id = auth.uid())
  )
);

CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at DESC);
CREATE INDEX idx_conversations_customer ON public.conversations(customer_id, last_message_at DESC);
CREATE INDEX idx_conversations_store ON public.conversations(store_id, last_message_at DESC);

-- Bump last_message_at when a new message arrives
CREATE OR REPLACE FUNCTION public.bump_conversation_last_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.conversations SET last_message_at = NEW.created_at WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_bump_conversation_last_message
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.bump_conversation_last_message();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
