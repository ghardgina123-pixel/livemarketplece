import { createFileRoute, Link } from "@tanstack/react-router";
import { ShoppingBag, Store as StoreIcon } from "lucide-react";
import { SITE_URL } from "@/lib/site";
import coverAsset from "@/assets/live-market-cover.png.asset.json";

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
        <div className="w-full max-w-[360px] overflow-hidden rounded-[2rem] bg-white/10 p-3 shadow-2xl ring-1 ring-white/20 backdrop-blur-sm">
          <img
            src={coverAsset.url}
            alt="Live Market — Compre, Converse e Receba"
            className="w-full rounded-[1.5rem] object-cover"
          />
        </div>
        <h1 className="sr-only">Live Market — Compre · Converse · Receba.</h1>
        <p className="text-center text-sm font-bold tracking-[0.18em] text-white/95">
          COMPRE <span className="text-primary-glow">•</span> CONVERSE{" "}
          <span className="text-primary-glow">•</span> RECEBA
        </p>
      </div>

      <div className="w-full space-y-3">
        <Link
          to="/home"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-bold text-secondary shadow-lg transition hover:bg-white/95 active:scale-[0.98]"
        >
          <ShoppingBag size={18} /> Sou Cliente — quero comprar
        </Link>
        <Link
          to="/cadastro"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-white/50 bg-white/10 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20 active:scale-[0.98]"
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
