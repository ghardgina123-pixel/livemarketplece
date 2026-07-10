import { useEffect, useRef, useState } from "react";
import {
  Room,
  RoomEvent,
  createLocalTracks,
  Track,
  VideoPresets,
  type LocalTrack,
  type LocalAudioTrack,
  type VideoCaptureOptions,
} from "livekit-client";
import { Loader2, Video, VideoOff, Radio, AlertTriangle, Mic, CheckCircle2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { issueLiveKitToken } from "@/lib/livekit.functions";

type Props = {
  liveId: string;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (message: string) => void;
};

type State =
  | "idle"
  | "requesting"      // a pedir permissão / hardware
  | "preflight"       // câmara+mic OK, aguardando confirmação do lojista
  | "connecting"      // token + ligação LiveKit
  | "publishing"      // AO VIVO
  | "error"
  | "unconfigured";

/**
 * Publisher LiveKit — usado pelo lojista para iniciar a transmissão em direto.
 * Solicita câmara + microfone e publica as tracks na sala do LiveKit.
 */
export function LivePublisher({ liveId, onConnected, onDisconnected, onError }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const roomRef = useRef<Room | null>(null);
  const tracksRef = useRef<LocalTrack[]>([]);
  const audioMeterRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [micOk, setMicOk] = useState(false);
  const issue = useServerFn(issueLiveKitToken);

  const stop = async () => {
    if (audioMeterRef.current) { cancelAnimationFrame(audioMeterRef.current); audioMeterRef.current = null; }
    if (audioCtxRef.current) { try { await audioCtxRef.current.close(); } catch { /* noop */ } audioCtxRef.current = null; }
    tracksRef.current.forEach((t) => {
      try { t.detach().forEach((el) => el.remove()); } catch { /* noop */ }
      try { t.stop(); } catch { /* noop */ }
    });
    tracksRef.current = [];
    if (roomRef.current) await roomRef.current.disconnect().catch(() => {});
    roomRef.current = null;
    setAudioLevel(0);
    setMicOk(false);
    setState("idle");
    onDisconnected?.();
  };

  // Passo 1: pré-teste de câmara e microfone. Adquire hardware, mostra
  // preview local + medidor de áudio. NÃO liga ao LiveKit nem marca a
  // live como AO VIVO — o lojista tem de confirmar depois.
  const preflight = async () => {
    // CRÍTICO (Chrome Android): getUserMedia tem de ser chamado como a
    // primeira operação assíncrona dentro do handler de clique, para
    // preservar a "user gesture chain". Qualquer await antes disto faz o
    // browser móvel rejeitar silenciosamente o pedido de câmara.
    setErrorMsg(null);
    setMicOk(false);
    const videoBase: VideoCaptureOptions = {
      resolution: VideoPresets.h720.resolution,
      // facingMode como ideal (não estrito) — evita OverconstrainedError
      // em telemóveis sem câmara traseira.
      facingMode: "environment",
    };
    const audioBase = { echoCancellation: true, noiseSuppression: true, autoGainControl: true } as const;
    // Inicia o pedido de tracks IMEDIATAMENTE, sem awaits antes.
    const tracksPromise = createLocalTracks({ audio: audioBase, video: videoBase }).catch(async (envErr) => {
      const name = (envErr as { name?: string } | null)?.name;
      if (name === "OverconstrainedError" || name === "NotFoundError" || name === "ConstraintNotSatisfiedError") {
        return createLocalTracks({ audio: audioBase, video: { facingMode: "user", resolution: VideoPresets.h720.resolution } });
      }
      throw envErr;
    });
    setState("requesting");
    let tracks: LocalTrack[] = [];
    try {
      tracks = await tracksPromise;
      // Valida que temos vídeo E áudio disponíveis.
      const videoTrack = tracks.find((t) => t.kind === Track.Kind.Video);
      const audioTrack = tracks.find((t) => t.kind === Track.Kind.Audio) as LocalAudioTrack | undefined;
      if (!videoTrack) throw new Error("Câmara indisponível. Verifique o dispositivo.");
      if (!audioTrack) throw new Error("Microfone indisponível. Verifique o dispositivo.");
      tracksRef.current = tracks;
      if (videoRef.current) videoTrack.attach(videoRef.current);

      // Medidor de nível do microfone — dá feedback visual de que o mic capta som.
      try {
        const mediaStream = audioTrack.mediaStream ?? (audioTrack.mediaStreamTrack ? new MediaStream([audioTrack.mediaStreamTrack]) : null);
        if (mediaStream) {
          const AC = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
          const ctx = new AC();
          audioCtxRef.current = ctx;
          const source = ctx.createMediaStreamSource(mediaStream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 512;
          source.connect(analyser);
          const buf = new Uint8Array(analyser.frequencyBinCount);
          const tick = () => {
            analyser.getByteTimeDomainData(buf);
            let peak = 0;
            for (let i = 0; i < buf.length; i++) {
              const v = Math.abs(buf[i] - 128);
              if (v > peak) peak = v;
            }
            const level = Math.min(1, peak / 64);
            setAudioLevel(level);
            if (level > 0.08) setMicOk(true);
            audioMeterRef.current = requestAnimationFrame(tick);
          };
          audioMeterRef.current = requestAnimationFrame(tick);
        }
      } catch { /* medidor é best-effort */ }

      setState("preflight");
    } catch (e) {
      handleError(e);
    }
  };

  // Passo 2: só agora liga ao LiveKit e publica. Se o publish falhar,
  // rollback via onError().
  const publish = async () => {
    if (state !== "preflight" || tracksRef.current.length === 0) return;
    setState("connecting");
    try {
      const { token, url } = await issue({ data: { liveId, canPublish: true } });
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        publishDefaults: {
          simulcast: true,
          videoSimulcastLayers: [VideoPresets.h180, VideoPresets.h360],
          videoCodec: "vp8",
        },
        videoCaptureDefaults: { resolution: VideoPresets.h720.resolution },
      });
      roomRef.current = room;
      room.on(RoomEvent.Disconnected, () => { setState("idle"); onDisconnected?.(); });
      await room.connect(url, token);
      for (const t of tracksRef.current) {
        await room.localParticipant.publishTrack(t);
      }
      setState("publishing");
      onConnected?.();
    } catch (e) {
      handleError(e);
    }
  };

  const handleError = async (e: unknown) => {
    const err = e as { name?: string; message?: string };
    let msg = err?.message || String(e);
    if (err?.name === "NotAllowedError") msg = "Permissão negada. Autorize a câmara e microfone nas definições do browser.";
    else if (err?.name === "NotFoundError") msg = "Nenhuma câmara ou microfone encontrado no dispositivo.";
    else if (err?.name === "NotReadableError") msg = "A câmara está a ser usada por outra aplicação. Feche-a e tente novamente.";
    else if (err?.name === "OverconstrainedError") msg = "A câmara pedida não é suportada neste dispositivo.";
    if (msg.includes("LIVEKIT_NOT_CONFIGURED")) setState("unconfigured");
    else { setErrorMsg(msg); setState("error"); }
    await stop().catch(() => {});
    onError?.(msg);
  };

  useEffect(() => {
    return () => { void stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3">
      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl bg-black">
        <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
        {state !== "publishing" && state !== "preflight" && state !== "connecting" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 text-center text-white/85">
            {state === "idle" && <><Video /><p className="text-sm">Câmara desligada</p></>}
            {state === "requesting" && <><Loader2 className="animate-spin" /><p className="text-sm">A pedir permissões…</p></>}
            {state === "error" && <><AlertTriangle className="text-yellow-400" /><p className="text-sm">Falha ao transmitir</p><p className="text-[11px] text-white/60">{errorMsg}</p></>}
            {state === "unconfigured" && <><Video /><p className="text-sm">Streaming não configurado</p></>}
          </div>
        )}
        {state === "preflight" && (
          <div className="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-1 text-[10px] font-semibold text-white">
            PRÉ-TESTE
          </div>
        )}
        {state === "connecting" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 text-white">
            <Loader2 className="animate-spin" />
            <p className="text-sm">A ligar à transmissão…</p>
          </div>
        )}
        {state === "publishing" && (
          <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-red-600 px-2 py-1 text-[10px] font-bold text-white">
            <Radio size={11} /> AO VIVO
          </div>
        )}
      </div>

      {(state === "preflight" || state === "connecting") && (
        <div className="rounded-xl border border-border bg-muted/40 p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <CheckCircle2 size={14} className="text-green-500" />
            <span>Câmara OK</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {micOk ? <CheckCircle2 size={14} className="text-green-500" /> : <Mic size={14} className="text-muted-foreground" />}
            <span>{micOk ? "Microfone OK" : "Fale para testar o microfone…"}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-background">
            <div
              className={`h-full transition-[width] duration-75 ${micOk ? "bg-green-500" : "bg-primary"}`}
              style={{ width: `${Math.round(audioLevel * 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Confirme que se vê e ouve antes de entrar AO VIVO. A live só é publicada depois de confirmar.
          </p>
        </div>
      )}

      <div className="flex gap-2">
        {state === "publishing" ? (
          <button onClick={stop} className="flex-1 rounded-full bg-destructive px-4 py-3 text-sm font-semibold text-destructive-foreground">
            <VideoOff size={16} className="mr-2 inline" /> Parar transmissão
          </button>
        ) : state === "preflight" ? (
          <>
            <button onClick={stop} className="rounded-full border border-border bg-background px-4 py-3 text-sm font-semibold">
              Cancelar
            </button>
            <button
              onClick={publish}
              disabled={!micOk}
              className="flex-1 rounded-full bg-red-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Radio size={16} className="mr-2 inline" /> Entrar AO VIVO
            </button>
          </>
        ) : state === "connecting" ? (
          <button disabled className="flex-1 rounded-full bg-primary/60 px-4 py-3 text-sm font-semibold text-primary-foreground">
            <Loader2 size={16} className="mr-2 inline animate-spin" /> A ligar…
          </button>
        ) : (
          <button onClick={preflight} disabled={state === "requesting"} className="flex-1 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            <Video size={16} className="mr-2 inline" /> Testar câmara e microfone
          </button>
        )}
      </div>
    </div>
  );
}