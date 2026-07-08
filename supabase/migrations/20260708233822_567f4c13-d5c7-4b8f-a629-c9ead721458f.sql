
CREATE OR REPLACE FUNCTION public.notify_offline_store_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_owner uuid; v_online boolean;
BEGIN
  SELECT s.owner_id, s.is_online
    INTO v_owner, v_online
  FROM public.conversations cv
  JOIN public.stores s ON s.id = cv.store_id
  WHERE cv.id = NEW.conversation_id
  LIMIT 1;

  IF v_owner IS NOT NULL AND v_owner <> NEW.sender_id AND COALESCE(v_online,false) = false THEN
    INSERT INTO public.user_notifications (user_id, kind, title, body, url, ref_id)
    VALUES (v_owner, 'chat_offline', 'Nova mensagem enquanto offline', left(coalesce(NEW.text,''),140), '/chat', NEW.conversation_id);
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN RETURN NEW; END;
$$;
REVOKE EXECUTE ON FUNCTION public.notify_offline_store_owner() FROM anon, PUBLIC;
