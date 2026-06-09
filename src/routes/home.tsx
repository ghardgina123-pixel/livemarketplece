import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Bell, Radio, ShieldCheck, Truck, BadgeCheck, ChevronRight, Star } from "lucide-react";
import { AppShell, StoreCover } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { stores, products } from "@/lib/data";
import { formatPrice, useCurrency } from "@/lib/currency";
import { CurrencySelector } from "@/components/CurrencySelector";
import logoAsset from "@/assets/live-market-logo.png.asset.json";
import livesAtraem from "@/assets/marketing/lives-atraem.png.asset.json";
import oneTapPay from "@/assets/marketing/one-tap-pay.png.asset.json";
import pulso from "@/assets/marketing/pulso.png.asset.json";
import nexusFlash from "@/assets/marketing/nexus-flash.png.asset.json";
import confianca from "@/assets/marketing/confianca.png.asset.json";
import escalaLocal from "@/assets/marketing/escala-local.png.asset.json";

const marketingBanners = [
  { src: livesAtraem.url, alt: "Lives imperdíveis atraem as melhores ofertas" },
  { src: oneTapPay.url, alt: "Pagamento instantâneo — um toque e pronto" },
  { src: pulso.url, alt: "Pulso em tempo real — tudo ao vivo, tudo agora" },
  { src: nexusFlash.url, alt: "Nexus flash — descontos relâmpago" },
  { src: confianca.url, alt: "Confiança inabalável" },
  { src: escalaLocal.url, alt: "Escala de plataforma adaptada localmente" },
];

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Início — Live Market" },
      { property: "og:url", content: "https://livemarket.app/home" },
    ],
    links: [{ rel: "canonical", href: "https://livemarket.app/home" }],
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

function Home() {
  const lives = stores.filter((s) => s.live);
  const currency = useCurrency();
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
              <h1 className="text-lg font-bold leading-tight">Live Market</h1>
              <p className="text-[10px] uppercase tracking-wider text-white/70">Compre · Converse · Receba</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CurrencySelector />
            <Link to="/ajuda" aria-label="Notificações" className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur-md">
              <Bell size={18} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--live)]" />
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

      <section className="px-5 py-5">
        <div className="grid grid-cols-4 gap-3">
          {categories.map((c) => (
            <Link key={c.n} to={c.to} className="flex flex-col items-center gap-1.5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-2xl">{c.e}</div>
              <span className="text-[11px] font-medium text-foreground">{c.n}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="pb-5">
        <div className="flex items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 rounded-full bg-[var(--live)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              <Radio size={11} /> ao vivo
            </span>
            <h2 className="text-base font-bold">Lives agora</h2>
          </div>
          <Link to="/lojas" className="flex items-center text-xs font-medium text-primary">Ver todas <ChevronRight size={14} /></Link>
        </div>
        <div className="mt-3 flex gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {lives.map((s) => (
            <Link key={s.id} to="/loja/$id" params={{ id: s.id }} className="w-40 shrink-0 overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-soft)]">
              <div className="relative">
                <StoreCover gradient={s.cover} emoji={s.emoji} className="h-44 w-full" />
                <span className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-[var(--live)] px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Live
                </span>
                <span className="absolute right-2 top-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {s.viewers?.toLocaleString("pt-BR")} 👁
                </span>
              </div>
              <div className="p-2.5">
                <p className="truncate text-sm font-semibold">{s.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">{s.tagline}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-5 pb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">Recomendados para você</h2>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {products.slice(0, 6).map((p) => (
            <Link key={p.id} to="/produto/$id" params={{ id: p.id }} className="overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-soft)]">
              <div className="flex h-32 items-center justify-center bg-accent text-5xl">{p.emoji}</div>
              <div className="p-2.5">
                <p className="line-clamp-2 text-xs font-medium text-foreground">{p.name}</p>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-sm font-bold text-primary">{formatPrice(p.price, currency)}</span>
                  {p.oldPrice && <span className="text-[10px] text-muted-foreground line-through">{formatPrice(p.oldPrice, currency)}</span>}
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Star size={10} className="fill-yellow-400 text-yellow-400" /> {p.rating} · {p.sold} vendidos
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3 px-5 pb-8">
        {marketingBanners.map((b) => (
          <div key={b.src} className="overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-soft)]">
            <img
              src={b.src}
              alt={b.alt}
              loading="lazy"
              decoding="async"
              className="block w-full"
            />
          </div>
        ))}
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