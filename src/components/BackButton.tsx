import { useRouter, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useRef } from "react";

/**
 * Botão de voltar reutilizável.
 * - Hit slop generoso (padding 3 = 12px + área visível 40x40 = alvo ≥48x48).
 * - Responde a `onPointerDown` para eliminar o atraso de 300ms do click no mobile.
 * - Feedback visual imediato via `active:` (opacity + escurecimento).
 */
export function BackButton({
  fallback = "/home",
  className = "relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 p-3 text-white transition active:scale-95 active:bg-white/30 active:opacity-70",
  label = "Voltar",
}: {
  fallback?: string;
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const navigate = useNavigate();
  const firedRef = useRef(false);
  const go = () => {
    if (firedRef.current) return;
    firedRef.current = true;
    // reset shortly after so o mesmo botão possa ser clicado novamente na próxima montagem
    setTimeout(() => { firedRef.current = false; }, 400);
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.history.back();
    } else {
      navigate({ to: fallback });
    }
  };
  return (
    <button
      type="button"
      onPointerDown={go}
      onClick={(e) => { e.preventDefault(); }}
      aria-label={label}
      className={className}
      style={{ touchAction: "manipulation" }}
    >
      <ArrowLeft size={18} />
    </button>
  );
}
