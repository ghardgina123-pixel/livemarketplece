
-- Guardar segredo partilhado do webhook de push na vault
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'push_webhook_secret') THEN
    PERFORM vault.create_secret('ElpTv_NTsm4T-UWsz0L9RTfRK_0-lWcNJoc1kkqm4nQ7-2RH8pmEsDeJNjLp1xeH', 'push_webhook_secret');
  END IF;
END $$;

-- Função utilitária: dispara HTTP POST para o dispatcher de push
CREATE OR REPLACE FUNCTION public.dispatch_push(_kind text, _payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_secret text;
BEGIN
  SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name = 'push_webhook_secret';
  IF v_secret IS NULL THEN RETURN; END IF;
  PERFORM net.http_post(
    url := 'https://project--d3f2b53d-d69f-4e32-9eb4-15ad57c7cb44.lovable.app/api/public/push-dispatch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_secret
    ),
    body := jsonb_build_object('kind', _kind, 'payload', _payload)
  );
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'dispatch_push failed: %', SQLERRM;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.dispatch_push(text, jsonb) FROM PUBLIC, anon, authenticated;

-- Trigger: quando um user_notifications é inserido, envia push para o dono
CREATE OR REPLACE FUNCTION public.on_user_notification_push()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.dispatch_push('user', jsonb_build_object(
    'user_id', NEW.user_id,
    'title', COALESCE(NEW.title, 'Live Market'),
    'body', COALESCE(NEW.body, ''),
    'url', COALESCE(NEW.url, '/'),
    'kind', NEW.kind
  ));
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_user_notif_push ON public.user_notifications;
CREATE TRIGGER trg_user_notif_push
AFTER INSERT ON public.user_notifications
FOR EACH ROW EXECUTE FUNCTION public.on_user_notification_push();

-- Trigger: alertas para admins (envia push a todos os admins)
CREATE OR REPLACE FUNCTION public.on_admin_notification_push()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.dispatch_push('admin', jsonb_build_object(
    'title', COALESCE(NEW.subject, 'Alerta administrativo'),
    'body', COALESCE(NEW.payload->>'name', NEW.kind, ''),
    'url', '/admin-dashboard',
    'kind', NEW.kind
  ));
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_admin_notif_push ON public.admin_notifications;
CREATE TRIGGER trg_admin_notif_push
AFTER INSERT ON public.admin_notifications
FOR EACH ROW EXECUTE FUNCTION public.on_admin_notification_push();
