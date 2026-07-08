
-- Tighten UPDATE check on deliveries: same rule for USING and WITH CHECK
DROP POLICY IF EXISTS deliveries_update_courier ON public.deliveries;
CREATE POLICY deliveries_update_courier ON public.deliveries FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.couriers c WHERE c.id=deliveries.courier_id AND c.user_id=auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.couriers c WHERE c.id=deliveries.courier_id AND c.user_id=auth.uid())
);

-- Revoke EXECUTE from anon on new SECURITY DEFINER functions (auth-only helpers/triggers)
REVOKE EXECUTE ON FUNCTION public.is_delivery_participant(uuid,uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_delivery_courier(uuid,uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.purge_delivery_tracking() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_offline_store_owner() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.broadcast_new_store() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.broadcast_store_status() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.broadcast_new_product() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.alert_admin_on_order_change() FROM anon, PUBLIC;

GRANT EXECUTE ON FUNCTION public.is_delivery_participant(uuid,uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_delivery_courier(uuid,uuid) TO authenticated, service_role;
