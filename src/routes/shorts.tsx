import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Heart, MessageCircle, Share2, ShoppingBag, Loader2, ArrowLeft, Play } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { cartStore } from "@/lib/cart-store";
import { toast } from "sonner";

export const Route = createFileRoute("/shorts")({
  head: () => ({
    meta: [
      { title: "Shorts — Live Market" },
      { name: "description", content: "Vídeos curtos dos produtos das lojas em destaque no Live Market." },
    ],
  }),
  component: ShortsFeed,
});

type Short = {
  id: string;
  video_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  product: {
    id: string;
    name: string;
    price_aoa: number;
    image_url: string | null;
    stock: number;
    store_id: string;
    stores: { name: string; logo_url: string | null } | null;
  } | null;
};

function ShortsFeed() {
  const [items, setItems] = useState<Short[] | null>(null);

  useEffect(() => {
    supabase
      .from("product_videos")
      .select("id, video_url, thumbnail_url, caption, product:products!inner(id, name, price_aoa, image_url, stock, store_id, stores(name, logo_url))")
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }) => setItems((data as unknown as Short[]) ?? []));
  }, []);

  if (items === null)
    return <AppShell><div className="flex h-[80vh] items-center justify-center"><Loader2 className="animate-spin text-primary" /></div></AppShell>;

  if (items.length === 0)
    return (
      <AppShell>
        <div className="flex h-[80vh] flex-col items-center justify-center gap-3 px-8 text-center">
          <Play size={40} className="text-primary" />
          <h2 className="text-lg font-bold">Ainda não há shorts</h2>
          <p className="text-sm text-muted-foreground">Os lojistas em breve vão publicar vídeos curtos dos produtos aqui.</p>
          <Link to="/lojas" className="mt-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">Explorar lojas</Link>
        </div>
      </AppShell>
    );

  return (
    <div className="mx-auto h-screen w-full max-w-[480px] overflow-y-scroll bg-black snap-y snap-mandatory">
      <Link to="/home" className="fixed left-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur" aria-label="Voltar">
        <ArrowLeft size={18} />
      </Link>
      {items.map((s) => <ShortCard key={s.id} short={s} />)}
    </div>
  );
}

function ShortCard({ short }: { short: Short }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) { v.play().catch(() => {}); setPlaying(true); }
        else { v.pause(); setPlaying(false); }
      },
      { threshold: 0.6 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  const buy = () => {
    if (!short.product) return;
    cartStore.add(
      {
        id: short.product.id,
        name: short.product.name,
        price: Number(short.product.price_aoa),
        emoji: "🛍️",
        storeId: short.product.store_id,
        rating: 5,
        sold: "—",
        description: short.caption ?? "",
      },
      1,
    );
    toast.success("Adicionado ao carrinho 🛒", {
      action: { label: "Ver", onClick: () => (window.location.href = "/carrinho") },
    });
  };

  return (
    <section className="relative h-screen w-full snap-start">
      <video
        ref={videoRef}
        src={short.video_url}
        poster={short.thumbnail_url ?? undefined}
        loop
        muted
        playsInline
        onClick={() => { const v = videoRef.current; if (!v) return; if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); } }}
        className="h-full w-full object-cover"
      />
      {!playing && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Play size={64} className="text-white/80 drop-shadow-lg" />
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5 pb-8 text-white">
        <div className="flex items-center gap-2">
          {short.product?.stores?.logo_url ? (
            <img src={short.product.stores.logo_url} alt="" className="h-8 w-8 rounded-full border border-white/40 object-cover" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-white/20" />
          )}
          <p className="text-sm font-semibold">{short.product?.stores?.name ?? "Loja"}</p>
        </div>
        {short.caption && <p className="mt-2 text-sm text-white/90 line-clamp-2">{short.caption}</p>}
        {short.product && (
          <button
            onClick={buy}
            disabled={short.product.stock <= 0}
            className="mt-3 flex w-full items-center justify-between rounded-2xl bg-primary px-4 py-3 text-left text-primary-foreground shadow-[var(--shadow-glow)] disabled:opacity-50"
          >
            <div className="min-w-0">
              <p className="truncate text-xs opacity-80">{short.product.name}</p>
              <p className="text-base font-bold">Kz {Number(short.product.price_aoa).toLocaleString("pt-AO")}</p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold backdrop-blur">
              <ShoppingBag size={14} /> {short.product.stock > 0 ? "Comprar agora" : "Esgotado"}
            </span>
          </button>
        )}
      </div>
      <div className="absolute right-3 bottom-32 flex flex-col gap-4 text-white">
        <SideAction icon={<Heart size={24} />} label="Curtir" />
        <SideAction icon={<MessageCircle size={24} />} label="Comentar" />
        <SideAction icon={<Share2 size={24} />} label="Compartilhar" />
      </div>
    </section>
  );
}

function SideAction({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex flex-col items-center gap-1" aria-label={label}>
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur">{icon}</span>
      <span className="text-[10px]">{label}</span>
    </button>
  );
}