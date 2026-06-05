import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Radio, Send, Users, ShoppingBag, Loader2, Video } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { cartStore } from "@/lib/cart-store";
import { toast } from "sonner";

export const Route = createFileRoute("/live/$id")({
  head: ({ params }) => ({
    meta: [
      { title: "Live — Live Market" },
      { name: "description", content: "Assista à transmissão ao vivo e compre direto da live." },
      { property: "og:url", content: `https://livemarket.app/live/${params.id}` },
    ],
  }),
  component: LivePage,
});

const msgSchema = z.string().trim().min(1).max(500);

type Live = {
  id: string; title: string; status: string; viewer_count: number; livekit_room: string;
  store: { id: string; name: string; logo_url: string | null } | null;
};
type LiveProduct = {
  product: { id: string; name: string; price_aoa: number; image_url: string | null; stock: number; store_id: string } | null;
};
type LiveMsg = { id: string; sender_id: string; text: string; created_at: string };

function LivePage() {
  const { id } = useParams({ from: "/live/$id" });
  const { user } = useAuth();
  const [live, setLive] = useState<Live | null | undefined>(undefined);
  const [products, setProducts] = useState<LiveProduct[]>([]);
  const [msgs, setMsgs] = useState<LiveMsg[]>([]);
  const [text, setText] = useState("");
  const [profiles, setProfiles] = useState<Record<string, { display_name: string | null; avatar_url: string | null }>>({});
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data: l } = await supabase.from("lives")
        .select("id, title, status, viewer_count, livekit_room, store:stores(id, name, logo_url)")
        .eq("id", id).maybeSingle();
      setLive((l as unknown as Live) ?? null);
      const { data: lp } = await supabase.from("live_products")
        .select("product:products(id, name, price_aoa, image_url, stock, store_id)")
        .eq("live_id", id);
      setProducts((lp as unknown as LiveProduct[]) ?? []);
      const { data: m } = await supabase.from("live_messages")
        .select("id, sender_id, text, created_at").eq("live_id", id)
        .order("created_at", { ascending: true }).limit(100);
      const messages = (m as LiveMsg[]) ?? [];
      setMsgs(messages);
      const ids = Array.from(new Set(messages.map((x) => x.sender_id)));
      if (ids.length) {
        const { data: ps } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", ids);
        const map: typeof profiles = {};
        (ps ?? []).forEach((p) => { map[p.id] = { display_name: p.display_name, avatar_url: p.avatar_url }; });
        setProfiles(map);
      }
    })();

    const ch = supabase
      .channel(`live-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "live_messages", filter: `live_id=eq.${id}` }, (payload) => {
        const m = payload.new as LiveMsg;
        setMsgs((prev) => [...prev, m]);
        if (!profiles[m.sender_id]) {
          supabase.from("profiles").select("id, display_name, avatar_url").eq("id", m.sender_id).maybeSingle()
            .then(({ data }) => data && setProfiles((p) => ({ ...p, [data.id]: { display_name: data.display_name, avatar_url: data.avatar_url } })));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Entre para comentar");
    const parsed = msgSchema.safeParse(text);
    if (!parsed.success) return toast.error("Mensagem inválida");
    setText("");
    const { error } = await supabase.from("live_messages").insert({ live_id: id, sender_id: user.id, text: parsed.data });
    if (error) { setText(parsed.data); toast.error(error.message); }
  };

  const buy = (p: NonNullable<LiveProduct["product"]>) => {
    cartStore.add({ id: p.id, name: p.name, price: Number(p.price_aoa), emoji: "🛍️", storeId: p.store_id, rating: 5, sold: "—", description: "" }, 1);
    toast.success(`${p.name} no carrinho`);
  };

  if (live === undefined) return <div className="flex h-screen items-center justify-center bg-black"><Loader2 className="animate-spin text-white" /></div>;
  if (!live) return <div className="flex h-screen items-center justify-center bg-black text-white">Live não encontrada</div>;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-black text-white">
      {/* Player area — LiveKit/WebRTC placeholder */}
      <div className="relative aspect-[9/16] w-full bg-gradient-to-br from-zinc-900 to-zinc-700">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/80">
          <Video size={48} />
          <p className="text-sm">Player do stream</p>
          <p className="text-[11px] text-white/50">LiveKit room: <code className="rounded bg-white/10 px-1.5 py-0.5">{live.livekit_room}</code></p>
        </div>
        <Link to="/lojas" className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 backdrop-blur" aria-label="Voltar"><ArrowLeft size={18} /></Link>
        <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-[var(--live)] px-3 py-1 text-[10px] font-bold uppercase shadow-lg">
          <Radio size={11} /> {live.status}
        </div>
        <div className="absolute left-3 bottom-3 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1 text-xs backdrop-blur">
          {live.store?.logo_url && <img src={live.store.logo_url} className="h-5 w-5 rounded-full object-cover" alt="" />}
          <span className="font-semibold">{live.store?.name}</span>
        </div>
        <div className="absolute right-3 bottom-3 flex items-center gap-1 rounded-full bg-black/50 px-3 py-1 text-xs backdrop-blur">
          <Users size={12} /> {live.viewer_count}
        </div>
      </div>

      {/* Live products strip */}
      {products.length > 0 && (
        <div className="border-y border-white/10 bg-black/60 px-3 py-2">
          <p className="mb-1.5 text-[10px] uppercase tracking-wide text-white/60">Em destaque na live</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {products.map((lp, i) => lp.product && (
              <button key={i} onClick={() => buy(lp.product!)} className="flex w-40 shrink-0 items-center gap-2 rounded-xl bg-white/10 p-2 text-left backdrop-blur">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white/10">
                  {lp.product.image_url ? <img src={lp.product.image_url} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-lg">🛍️</div>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-semibold">{lp.product.name}</p>
                  <p className="text-[11px] text-primary">Kz {Number(lp.product.price_aoa).toLocaleString("pt-AO")}</p>
                </div>
                <ShoppingBag size={14} className="shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Live chat */}
      <div className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {msgs.length === 0 && <p className="py-6 text-center text-xs text-white/50">Seja o primeiro a comentar 👋</p>}
        {msgs.map((m) => {
          const p = profiles[m.sender_id];
          return (
            <div key={m.id} className="flex items-start gap-2 text-sm">
              <div className="mt-0.5 h-6 w-6 shrink-0 overflow-hidden rounded-full bg-white/20">
                {p?.avatar_url && <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0">
                <span className="mr-1.5 text-[11px] font-bold text-primary">{p?.display_name ?? "Usuário"}</span>
                <span className="text-white/90">{m.text}</span>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <form onSubmit={send} className="flex items-center gap-2 border-t border-white/10 bg-black p-2.5">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={user ? "Adicione um comentário…" : "Entre para comentar"}
          maxLength={500}
          disabled={!user}
          className="h-10 flex-1 rounded-full border-white/20 bg-white/10 text-white placeholder:text-white/50"
        />
        <button type="submit" disabled={!user || !text.trim()} className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}