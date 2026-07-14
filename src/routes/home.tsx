import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, Radio, ShieldCheck, Truck, BadgeCheck, ChevronRight, Star, Store as StoreIcon, PlayCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { formatPrice, useCurrency } from "@/lib/currency";
import { supabase } from "@/integrations/supabase/client";
import logoAsset from "@/assets/live-market-logo.png.asset.json";
import homeHero from "@/assets/marketing/home-hero.jpg";
import organicosAsset from "@/assets/sellers/organicos.jpg.asset.json";
import techAsset from "@/assets/sellers/tech.jpg.asset.json";
import modaAsset from "@/assets/sellers/moda.jpg.asset.json";
import belezaAsset from "@/assets/sellers/beleza.jpg.asset.json";

type LiveStore = { id: string; name: string; tagline: string; cover: string; emoji: string; image: string; viewers: number; demo?: boolean };
type FeedProduct = { id: string; name: string; price: number; oldPrice?: number; emoji: string; rating: number; sold: string };

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Live Market — Mercado ao Vivo em Angola" },
      { name: "description", content: "Descubra lojas ao vivo em Angola, compre direto da live, converse com vendedores e receba em casa." },
      { property: "og:title", content: "Live Market — Mercado ao Vivo em Angola" },
      { property: "og:description", content: "Descubra lojas ao vivo em Angola, compre direto da live e receba em casa." },
      { property: "og:url", content: "https://www.livemarketplece.live/home" },
    ],
    links: [{ rel: "canonical", href: "https://www.livemarketplece.live/home" }],
  }),
  component: Home,
});

const categories = [
  { e: "🥑", n: "Orgânicos", to: "/lojas" as const },
  { e: "💻", n: "Tech", to: "/lojas" as const },
  { e: "👗", n: "Moda", to: "/lojas" as const },
  { e: "🏘️", n: "Imóveis", to: "/imoveis" as const },
  { e: "⚽", n: "Esporte", to: "/lojas" as const },
  { e: "💄", n: "Beleza", to: "/lojas" as const },
  { e: "🍯", n: "Mercado", to: "/lojas" as const },
  { e: "🎁", n: "Ofertas", to: "/lojas" as const },
];

const sellerImages = [organicosAsset.url, techAsset.url, modaAsset.url, belezaAsset.url];

// Lojas demonstrativas (Kikolo Shopping) — exibidas apenas enquanto não houver
// lojas reais ativas no banco. Assim que vendedores reais ficarem ativos, estas
// desaparecem automaticamente.
const DEMO_LIVES: LiveStore[] = [
  {
    id: "demo-kikolo-tenis",
    name: "Kikolo Sneakers",
    tagline: "Ténis originais · Kikolo Shopping",
    cover: "from-zinc-700 to-zinc-900",
    emoji: "👟",
    image: modaAsset.url,
    viewers: 142,
    demo: true,
  },
  {
    id: "demo-kikolo-diversos",
    name: "Kikolo Diversos",
    tagline: "Casa, moda e tecnologia · Kikolo Shopping",
    cover: "from-amber-500 to-rose-600",
    emoji: "🛍️",
    image: organicosAsset.url,
    viewers: 87,
    demo: true,
  },
];

function Home() {
  const currency = useCurrency();
  const [lives, setLives] = useState<LiveStore[]>([]);
  const [feed, setFeed] = useState<FeedProduct[]>([]);

  useEffect(() => {
    (async () => {
      const { data: storesData } = await supabase
        .from("stores")
        .select("id, name, description, category")
        .eq("status", "active")
        .limit(8);
      const real = (storesData ?? []).map((s, i) => ({
          id: s.id,
          name: s.name,
          tagline: s.description ?? s.category ?? "Loja ao vivo",
          cover: ["from-emerald-400 to-teal-600", "from-blue-500 to-indigo-700", "from-pink-400 to-rose-600", "from-amber-400 to-orange-600"][i % 4],
          emoji: ["🛍️", "✨", "🔥", "🎁"][i % 4],
          image: sellerImages[i % sellerImages.length],
          viewers: 0,
      }));
      // Quando não houver lojas reais ativas, mostramos as demonstrativas.
      setLives(real.length > 0 ? real : DEMO_LIVES);

      const { data: productsData } = await supabase
        .from("products")
        .select("id, name, price_aoa, stock")
        .eq("status", "approved")
        .limit(12);
      setFeed(
        (productsData ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          // products use price_aoa; convert to "BRL base" expected by formatPrice
          // by dividing by the static AOA/BRL rate (175 Kz per BRL).
          price: Number(p.price_aoa ?? 0) / 175,
          emoji: "🛒",
          rating: 5,
          sold: String(p.stock ?? 0),
        })),
      );
    })();
  }, []);

  return (
    <AppShell>
      <header className="px-5 pt-6 pb-3 text-white" style={{ background: "var(--gradient-brand)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={logoAsset.url}
              alt="Live Market"
              width={44}
              height={44}
              loading="eager"
              decoding="async"
              className="h-11 w-11 rounded-xl bg-white/90 object-contain p-1 shadow-sm"
            />
            <div>
              <p className="text-xs text-white/70">Olá, bem-vindo 👋</p>
              <h1 className="text-lg font-bold leading-tight">Live Market — Mercado ao Vivo em Angola</h1>
              <p className="text-[10px] uppercase tracking-wider text-white/70">O mercado ao vivo no seu ecrã.</p>
            </div>
          </div>
          {/* Reservar espaço à direita para o sino flutuante fixo (NotificationBell no AppShell). */}
          <div className="flex items-center gap-2 pr-12">
            <Link
              to="/lojista"
              className="flex h-9 items-center gap-1.5 rounded-full bg-white/15 px-3 text-[11px] font-semibold backdrop-blur-md hover:bg-white/25"
              style={{ touchAction: "manipulation" }}
            >
              <StoreIcon size={14} /> Área do Lojista
            </Link>
          </div>
        </div>
        <Link to="/lojas" className="relative mt-4 block">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input readOnly placeholder="Buscar produtos, lojas, lives…" className="h-11 cursor-pointer rounded-xl border-0 bg-white pl-10 text-foreground placeholder:text-muted-foreground" />
        </Link>
        <div className="mt-3 flex items-center gap-3 text-[11px] text-white/85">
          <span className="flex items-center gap-1"><ShieldCheck size={13} /> Compra protegida</span>
          <span className="flex items-center gap-1"><Truck size={13} /> Frete rápido</span>
          <span className="flex items-center gap-1"><BadgeCheck size={13} /> Lojas verificadas</span>
        </div>
      </header>

      <section className="cv-auto px-5 pt-4">
        <Link to="/lojas" className="group relative block overflow-hidden rounded-2xl shadow-[var(--shadow-soft)]">
          <img
            src={homeHero}
            alt="Compre ao vivo nas lojas angolanas do Live Market"
            width={1280}
            height={896}
            loading="eager"
            decoding="async"
            className="h-44 w-full object-cover transition group-active:scale-[0.99]"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 text-white">
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--live)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
              <Radio size={11} /> Ao vivo agora
            </span>
            <p className="mt-1.5 text-base font-bold leading-tight">Compre · Converse · Receba</p>
            <p className="text-[11px] text-white/85">Lojas reais de Angola, em tempo real.</p>
          </div>
        </Link>
      </section>

      <section className="cv-auto px-5 py-5">
        <div className="grid grid-cols-4 gap-3">
          {categories.map((c) => (
            <Link key={c.n} to={c.to} className="flex flex-col items-center gap-1.5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm ring-1 ring-border/60">{c.e}</div>
              <span className="text-[11px] font-medium text-foreground">{c.n}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="cv-auto pb-5">
        <div className="flex items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 rounded-full bg-[var(--live)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              <Radio size={11} /> ao vivo
            </span>
            <h2 className="text-base font-bold">Lojas em Direto</h2>
          </div>
          <Link to="/lojas" className="flex items-center text-xs font-medium text-primary">Ver todas <ChevronRight size={14} /></Link>
        </div>
        {lives.length === 0 ? (
          <p className="px-5 pt-3 text-xs text-muted-foreground">Nenhuma loja ao vivo no momento.</p>
        ) : (
          <div className="smooth-scroll mt-3 flex gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {lives.map((s) => (
              <div key={s.id} className="gpu w-40 shrink-0 overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-soft)]">
                <Link to={s.demo ? "/live-demo/$id" : "/loja/$id"} params={{ id: s.id }} className="block">
                  <div className="relative">
                    <img src={s.image} alt={s.name} loading="lazy" decoding="async" className="h-40 w-full object-cover" />
                    <span className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-[var(--live)] px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Live
                    </span>
                  </div>
                  <div className="px-2.5 pt-2">
                    <p className="truncate text-sm font-semibold">{s.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{s.tagline}</p>
                  </div>
                </Link>
                <Link
                  to={s.demo ? "/live-demo/$id" : "/live/$id"}
                  params={{ id: s.id }}
                  className="m-2 flex items-center justify-center gap-1 rounded-full bg-[var(--live)] px-2 py-1.5 text-[11px] font-bold text-white"
                >
                  <PlayCircle size={13} /> Entrar na Live
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="cv-auto px-5 pb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">Recomendados para você</h2>
        </div>
        {feed.length === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">Em breve novos produtos das lojas verificadas.</p>
        ) : (
          <div className="mt-3">
            <div className="grid grid-cols-2 gap-3">
              {feed.map((p) => (
                <Link key={p.id} to="/produto/$id" params={{ id: p.id }} className="overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-soft)]">
                  <div className="flex h-32 items-center justify-center bg-accent text-5xl">{p.emoji}</div>
                  <div className="p-2.5">
                    <p className="line-clamp-2 text-xs font-medium text-foreground">{p.name}</p>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-sm font-bold text-primary">{formatPrice(p.price, currency)}</span>
                      {p.oldPrice && <span className="text-[10px] text-muted-foreground line-through">{formatPrice(p.oldPrice, currency)}</span>}
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Star size={10} className="fill-yellow-400 text-yellow-400" /> {p.rating} · {p.sold} disp.
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      <footer className="mx-5 mb-8 rounded-2xl bg-secondary p-5 text-center text-xs text-secondary-foreground">
        <p className="font-bold tracking-wide">LIVE MARKET — Mercado Ao Vivo</p>
        <p className="mt-1 text-[11px] opacity-80">O seu marketplace completo em Angola.</p>
        <div className="mt-3 space-y-1 text-[11px]">
          <p>
            🌐 <a href="https://www.livemarketplece.live" className="font-semibold underline">www.livemarketplece.live</a>
          </p>
          <p>
            ☎️ Apoio:{" "}
            <a href="tel:+244927046161" className="font-semibold underline">+244 927 046 161</a>
          </p>
        </div>
      </footer>
    </AppShell>
  );
}