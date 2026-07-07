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
    tracksRef.current.forEach((t) => t.stop());
    tracksRef.current = [];
    if (roomRef.current) await roomRef.current.disconnect().catch(() => {});
    roomRef.current = null;
    setState("idle");
    onDisconnected?.();
  };

  const start = async () => {
    setState("requesting");
    setErrorMsg(null);
    try {
      const { token, url } = await issue({ data: { liveId, canPublish: true } });
      const room = new Room({ adaptiveStream: true, dynacast: true });
      roomRef.current = room;
      room.on(RoomEvent.Disconnected, () => { setState("idle"); onDisconnected?.(); });
      await room.connect(url, token);
      const tracks = await createLocalTracks({ audio: true, video: { facingMode: "environment" } });
      tracksRef.current = tracks;
      for (const t of tracks) {
        await room.localParticipant.publishTrack(t);
        if (t.kind === Track.Kind.Video && videoRef.current) t.attach(videoRef.current);
      }
      setState("publishing");
      onConnected?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
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