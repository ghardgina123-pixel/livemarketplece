import { useEffect, useRef, useState } from "react";
import { Room, RoomEvent, createLocalTracks, Track, type LocalTrack } from "livekit-client";
import { Loader2, Video, VideoOff, Radio, AlertTriangle } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { issueLiveKitToken } from "@/lib/livekit.functions";

type Props = {
  liveId: string;
  onConnected?: () => void;
  onDisconnected?: () => void;
};

type State = "idle" | "requesting" | "publishing" | "error" | "unconfigured";

/**
 * Publisher LiveKit — usado pelo lojista para iniciar a transmissão em direto.
 * Solicita câmara + microfone e publica as tracks na sala do LiveKit.
 */
export function LivePublisher({ liveId, onConnected, onDisconnected }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const roomRef = useRef<Room | null>(null);
  const tracksRef = useRef<LocalTrack[]>([]);
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const issue = useServerFn(issueLiveKitToken);

  const stop = async () => {
    tracksRef.current.forEach((t) => {
      try { t.detach().forEach((el) => el.remove()); } catch { /* noop */ }
      try { t.stop(); } catch { /* noop */ }
    });
    tracksRef.current = [];
    if (roomRef.current) await roomRef.current.disconnect().catch(() => {});
    roomRef.current = null;
    setState("idle");
    onDisconnected?.();
  };

  const start = async () => {
    setState("requesting");
    setErrorMsg(null);
    // CRITICAL (mobile): getUserMedia deve ser chamado sincronamente dentro
    // do gesto do utilizador — antes de qualquer outro await — senão o
    // iOS/Android bloqueiam a câmara/mic silenciosamente. Por isso pedimos
    // as tracks PRIMEIRO e só depois emitimos o token e ligamos à sala.
    let tracks: LocalTrack[] = [];
    try {
      // Verificação proativa da permissão (dá mensagem melhor no telemóvel).
      if (typeof navigator !== "undefined" && "permissions" in navigator) {
        try {
          const cam = await navigator.permissions.query({ name: "camera" as PermissionName });
          if (cam.state === "denied") throw new Error("Permissão da câmara bloqueada. Ative-a nas definições do browser.");
        } catch { /* alguns browsers móveis não suportam permissions.query; segue-se em frente */ }
      }
      try {
        tracks = await createLocalTracks({ audio: true, video: { facingMode: "environment" } });
      } catch (envErr) {
        // Fallback: câmara frontal (muitos telemóveis não têm "environment" acessível
        // ou o browser rejeita a constraint exata).
        const name = (envErr as { name?: string } | null)?.name;
        if (name === "OverconstrainedError" || name === "NotFoundError" || name === "ConstraintNotSatisfiedError") {
          tracks = await createLocalTracks({ audio: true, video: { facingMode: "user" } });
        } else {
          throw envErr;
        }
      }
      tracksRef.current = tracks;
      // Attach a preview local imediatamente para o utilizador ver a câmara
      // mesmo antes de a ligação LiveKit estar estabelecida.
      const videoTrack = tracks.find((t) => t.kind === Track.Kind.Video);
      if (videoTrack && videoRef.current) videoTrack.attach(videoRef.current);

      const { token, url } = await issue({ data: { liveId, canPublish: true } });
      const room = new Room({ adaptiveStream: true, dynacast: true });
      roomRef.current = room;
      room.on(RoomEvent.Disconnected, () => { setState("idle"); onDisconnected?.(); });
      await room.connect(url, token);
      for (const t of tracks) {
        await room.localParticipant.publishTrack(t);
      }
      setState("publishing");
      onConnected?.();
    } catch (e) {
      const err = e as { name?: string; message?: string };
      let msg = err?.message || String(e);
      if (err?.name === "NotAllowedError") msg = "Permissão negada. Autorize a câmara e microfone nas definições do browser.";
      else if (err?.name === "NotFoundError") msg = "Nenhuma câmara ou microfone encontrado no dispositivo.";
      else if (err?.name === "NotReadableError") msg = "A câmara está a ser usada por outra aplicação. Feche-a e tente novamente.";
      else if (err?.name === "OverconstrainedError") msg = "A câmara pedida não é suportada neste dispositivo.";
      if (msg.includes("LIVEKIT_NOT_CONFIGURED")) setState("unconfigured");
      else { setErrorMsg(msg); setState("error"); }
      await stop().catch(() => {});
    }
  };

  useEffect(() => {
    return () => { void stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3">
      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl bg-black">
        <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
        {state !== "publishing" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 text-center text-white/85">
            {state === "idle" && <><Video /><p className="text-sm">Câmara desligada</p></>}
            {state === "requesting" && <><Loader2 className="animate-spin" /><p className="text-sm">A ligar…</p></>}
            {state === "error" && <><AlertTriangle className="text-yellow-400" /><p className="text-sm">Falha ao transmitir</p><p className="text-[11px] text-white/60">{errorMsg}</p></>}
            {state === "unconfigured" && <><Video /><p className="text-sm">Streaming não configurado</p></>}
          </div>
        )}
        {state === "publishing" && (
          <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-red-600 px-2 py-1 text-[10px] font-bold text-white">
            <Radio size={11} /> AO VIVO
          </div>
        )}
      </div>
      <div className="flex gap-2">
        {state === "publishing" ? (
          <button onClick={stop} className="flex-1 rounded-full bg-destructive px-4 py-3 text-sm font-semibold text-destructive-foreground">
            <VideoOff size={16} className="mr-2 inline" /> Parar transmissão
          </button>
        ) : (
          <button onClick={start} disabled={state === "requesting"} className="flex-1 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            <Video size={16} className="mr-2 inline" /> Iniciar câmara
          </button>
        )}
      </div>
    </div>
  );
}