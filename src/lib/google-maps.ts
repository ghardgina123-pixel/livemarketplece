let promise: Promise<typeof google.maps> | null = null;

declare global {
  interface Window {
    __lmInitGoogleMaps?: () => void;
    google?: typeof google;
  }
}

export function loadGoogleMaps(): Promise<typeof google.maps> {
  if (typeof window === "undefined") return Promise.reject(new Error("ssr"));
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (promise) return promise;

  const key = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY as string | undefined;
  const channel = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID as string | undefined;
  if (!key) return Promise.reject(new Error("google_maps_key_missing"));

  promise = new Promise((resolve, reject) => {
    window.__lmInitGoogleMaps = () => {
      if (window.google?.maps) resolve(window.google.maps);
      else reject(new Error("google_maps_load_failed"));
    };
    const s = document.createElement("script");
    s.async = true;
    s.defer = true;
    const params = new URLSearchParams({ key, loading: "async", callback: "__lmInitGoogleMaps" });
    if (channel) params.set("channel", channel);
    s.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    s.onerror = () => reject(new Error("google_maps_script_error"));
    document.head.appendChild(s);
  });
  return promise;
}