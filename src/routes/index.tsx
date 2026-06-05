import { createFileRoute, Link } from "@tanstack/react-router";
import { Radio, ShoppingBag, Store as StoreIcon } from "lucide-react";
import { SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Live Market — Compre, Converse e Receba." },
      { name: "description", content: "O marketplace onde clientes e lojas se conectam em tempo real." },
      { property: "og:url", content: `${SITE_URL}/` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/` }],
  }),
  component: Splash,
});

function Splash() {
  return (
    <div
      className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col items-center justify-between px-6 py-12 text-white"
      style={{ background: "var(--gradient-brand)" }}
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-6 animate-in fade-in zoom-in-95 duration-700">
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

      <div className="w-full space-y-3">
        <Link
          to="/cadastro"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-bold text-secondary shadow-lg"
        >
          <ShoppingBag size={18} /> Sou Cliente — quero comprar
        </Link>
        <Link
          to="/cadastro"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-white/40 bg-white/10 text-sm font-bold text-white backdrop-blur"
        >
          <StoreIcon size={18} /> Sou Lojista — quero vender
        </Link>
        <Link to="/login" className="block pt-2 text-center text-xs font-semibold text-white/90">
          Já tenho conta · Entrar
        </Link>
      </div>
    </div>
  );
}
