import { useEffect, useRef, useState } from "react";
import { Room, RoomEvent, ConnectionState, Track, type RemoteTrack, type RemoteTrackPublication, type RemoteParticipant } from "livekit-client";
import { Loader2, Video, WifiOff, AlertTriangle } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { issueLiveKitToken } from "@/lib/livekit.functions";

type Props = { liveId: string };

type State = "connecting" | "reconnecting" | "live" | "waiting" | "error" | "unconfigured";

/**
 * Player LiveKit isolado do chat — falhas/reconexões aqui não
 * bloqueiam o restante da UI (chat e produtos continuam reativos).
 */
export function LivePlayer({ liveId }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const roomRef = useRef<Room | null>(null);
  const [state, setState] = useState<State>("connecting");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const issue = useServerFn(issueLiveKitToken);

  useEffect(() => {
    let cancelled = false;
    const room = new Room({
      adaptiveStream: true, // mobile-friendly: ajusta resolução à viewport
      dynacast: true,
    });
    roomRef.current = room;

    const attachTrack = (track: RemoteTrack) => {
      if (track.kind === Track.Kind.Video && videoRef.current) {
        track.attach(videoRef.current);
        setState("live");
      } else if (track.kind === Track.Kind.Audio && audioRef.current) {
        track.attach(audioRef.current);
      }
    };

    const onSubscribed = (track: RemoteTrack, _pub: RemoteTrackPublication, _p: RemoteParticipant) => attachTrack(track);
    const onUnsubscribed = (track: RemoteTrack) => track.detach().forEach((el) => el.remove());
    const onStateChange = (s: ConnectionState) => {
      if (cancelled) return;
      if (s === ConnectionState.Reconnecting) setState("reconnecting");
      else if (s === ConnectionState.Connected) {
        const hasVideo = Array.from(room.remoteParticipants.values())
          .some((p) => Array.from(p.trackPublications.values()).some((t) => t.kind === Track.Kind.Video && t.isSubscribed));
        setState(hasVideo ? "live" : "waiting");
      } else if (s === ConnectionState.Disconnected) setState("reconnecting");
    };

    room
      .on(RoomEvent.TrackSubscribed, onSubscribed)
      .on(RoomEvent.TrackUnsubscribed, onUnsubscribed)
      .on(RoomEvent.ConnectionStateChanged, onStateChange);

    (async () => {
      try {
        const { token, url } = await issue({ data: { liveId, canPublish: false } });
        if (cancelled) return;
        await room.connect(url, token, { autoSubscribe: true });
        if (cancelled) return;
        const hasVideo = Array.from(room.remoteParticipants.values())
          .some((p) => Array.from(p.trackPublications.values()).some((t) => t.kind === Track.Kind.Video));
        setState(hasVideo ? "live" : "waiting");
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("LIVEKIT_NOT_CONFIGURED")) {
          setState("unconfigured");
        } else {
          setErrorMsg(msg);
          setState("error");
        }
      }
    })();

    return () => {
      cancelled = true;
      room.disconnect().catch(() => {});
      roomRef.current = null;
    };
  }, [liveId, issue]);

  return (
    <>
      <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 h-full w-full object-cover" />
      <audio ref={audioRef} autoPlay />
      {state !== "live" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 text-center text-white/85 backdrop-blur-sm">
          {state === "connecting" && <><Loader2 className="animate-spin" /> <p className="text-sm">Conectando ao stream…</p></>}
          {state === "reconnecting" && <><WifiOff /> <p className="text-sm">Reconectando…</p><p className="text-[11px] text-white/60">Sua conexão oscilou. O chat continua ativo.</p></>}
          {state === "waiting" && <><Video /> <p className="text-sm">Aguardando o lojista iniciar a transmissão</p></>}
          {state === "error" && <><AlertTriangle className="text-yellow-400" /><p className="text-sm">Falha no stream</p><p className="text-[11px] text-white/60">{errorMsg}</p></>}
          {state === "unconfigured" && <><Video /><p className="text-sm">Streaming não configurado</p><p className="text-[11px] text-white/60">Adicione as credenciais LiveKit nos secrets.</p></>}
        </div>
      )}
    </>
  );
}