import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

/** Marks the current user as online in profiles.is_online while the tab is active. */
export function PresenceHeartbeat() {
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const ping = async (online: boolean) => {
      if (cancelled) return;
      await supabase.from("profiles").update({ is_online: online, last_seen_at: new Date().toISOString() }).eq("id", user.id);
    };
    ping(true);
    const interval = window.setInterval(() => { if (document.visibilityState === "visible") ping(true); }, 45000);
    const onVis = () => ping(document.visibilityState === "visible");
    const onBeforeUnload = () => { ping(false); };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("beforeunload", onBeforeUnload);
      ping(false);
    };
  }, [user?.id]);
  return null;
}