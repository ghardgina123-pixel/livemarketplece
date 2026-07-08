import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { getVapidPublicKey, subscribePush } from "@/lib/push.functions";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = typeof atob === "function" ? atob(base64) : "";
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

/** Silently registers the SW and creates/refreshes the Web Push subscription for the signed-in user. */
export function PushRegistrar() {
  const { user } = useAuth();
  const fetchKey = useServerFn(getVapidPublicKey);
  const saveSub = useServerFn(subscribePush);

  useEffect(() => {
    if (!user) return;
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    // Skip inside Lovable preview iframes to avoid stale SWs
    const host = window.location.hostname;
    if (host.startsWith("id-preview--") || host.startsWith("preview--")) return;
    if (Notification.permission === "denied") return;

    let cancelled = false;
    (async () => {
      try {
        const reg = await navigator.serviceWorker.register("/push-sw.js", { scope: "/" });
        await navigator.serviceWorker.ready;

        // Ask permission lazily (only prompt once)
        if (Notification.permission === "default") {
          const perm = await Notification.requestPermission();
          if (perm !== "granted") return;
        }
        if (Notification.permission !== "granted") return;

        const { key } = await fetchKey();
        if (!key || cancelled) return;

        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(key),
          });
        }
        const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
        if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;
        await saveSub({
          data: {
            endpoint: json.endpoint,
            p256dh: json.keys.p256dh,
            auth: json.keys.auth,
            userAgent: navigator.userAgent.slice(0, 500),
          },
        });
      } catch (err) {
        // Silent: push is best-effort
        console.warn("[push] registration failed", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, fetchKey, saveSub]);

  return null;
}