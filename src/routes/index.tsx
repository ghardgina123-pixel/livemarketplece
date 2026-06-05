import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Radio } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Live Market — Compre, Converse e Receba." },
      { name: "description", content: "O marketplace onde clientes e lojas se conectam em tempo real." },
    ],
  }),
  component: Splash,
});

function Splash() {
  const navigate = useNavigate();
  useEffect(() => {
    const t = setTimeout(() => navigate({ to: "/login" }), 1800);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div
      className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col items-center justify-center px-6 text-white"
      style={{ background: "var(--gradient-brand)" }}
    >
      <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-700">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-white/30" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-white/15 backdrop-blur-md ring-1 ring-white/30">
            <Radio size={48} className="text-white" />
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Live Market</h1>
          <p className="mt-2 text-sm font-medium text-white/90">Compre, Converse e Receba.</p>
          <p className="mt-1 text-xs text-white/70">O marketplace onde clientes e lojas se conectam em tempo real.</p>
        </div>
      </div>
      <div className="absolute bottom-10 text-xs text-white/60">Carregando experiência…</div>
    </div>
  );
}
