-- Revogar EXECUTE de anon (e public) das funções que exigem autenticação
-- Funções admin_*: só admins autenticados (a checagem interna via has_role já bloqueia, mas removemos a superfície pública)
REVOKE EXECUTE ON FUNCTION public.admin_approve_agency(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_reject_agency(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_approve_property(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_reject_property(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_approve_agency_live_fee(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_reject_agency_live_fee(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_approve_store(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_reject_store(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_create_store_for_email(text, text, text, text, boolean) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.admin_approve_agency(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reject_agency(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_approve_property(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reject_property(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_approve_agency_live_fee(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reject_agency_live_fee(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_approve_store(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reject_store(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_store_for_email(text, text, text, text, boolean) TO authenticated;

-- Funções que exigem sessão do usuário
REVOKE EXECUTE ON FUNCTION public.create_order_with_items(uuid, uuid, jsonb, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_order_with_items(uuid, uuid, jsonb, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_own_phone() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_own_phone() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- Filas de e-mail e infra: apenas service_role executa (invocadas por triggers/cron com SECURITY DEFINER)
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch() FROM PUBLIC, anon, authenticated;

-- approved_stores_count e seller_signup_status permanecem acessíveis a anon (usadas na tela pública de cadastro de lojista)