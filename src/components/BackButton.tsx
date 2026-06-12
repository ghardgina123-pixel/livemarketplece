import { useRouter, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

/** Botão de voltar reutilizável. Tenta voltar no histórico; se não houver, navega para `fallback`. */
export function BackButton({
  fallback = "/home",
  className = "flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white",
  label = "Voltar",
}: {
  fallback?: string;
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const navigate = useNavigate();
  const handle = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.history.back();
    } else {
      navigate({ to: fallback });
    }
  };
  return (
    <button type="button" onClick={handle} aria-label={label} className={className}>
      <ArrowLeft size={18} />
    </button>
  );
}
