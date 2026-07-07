import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { Loader2, Radio, Play, Square, Plus, Users, ExternalLink } from "lucide-react";
import { LojistaShell, useLojistaStore } from "@/components/LojistaShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const LivePublisher = lazy(() => import("@/components/LivePublisher").then((m) => ({ default: m.LivePublisher })));

export const Route = createFileRoute("/_authenticated/lojista/lives")({
  head: () => ({ meta: [{ title: "Lives — Lojista" }] }),
  component: () => (
    <LojistaShell title="Transmissões ao vivo">
      <LivesManager />
    </LojistaShell>
  ),
});

type Live = {
  id: string;
  title: string;
  status: "scheduled" | "live" | "ended";
  viewer_count: number;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
};

function LivesManager() {
  const { store } = useLojistaStore();
  const [lives, setLives] = useState<Live[] | null>(null);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const storeId = store?.id;

  const load = async (sid: string) => {
    const { data } = await supabase
      .from("lives")
      .select("id, title, status, viewer_count, started_at, ended_at, created_at")
      .eq("store_id", sid)
      .order("created_at", { ascending: false })
      .limit(20);
    setLives((data as Live[]) ?? []);
  };

  useEffect(() => {
    if (!storeId) return;
    load(storeId);
    const ch = supabase
      .channel(`lojista-lives-${storeId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "lives", filter: `store_id=eq.${storeId}` }, () => load(storeId))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [storeId]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId || !title.trim()) return;
    setCreating(true);
    // livekit_room precisa ser único e curto — usar id da loja + timestamp
    const room = `store-${storeId.slice(0, 8)}-${Date.now().toString(36)}`;
    const { data, error } = await supabase
      .from("lives")
      .insert({ store_id: storeId, title: title.trim(), livekit_room: room, status: "scheduled" })
      .select("id")
      .single();
    setCreating(false);
    if (error) return toast.error(error.message);
    setTitle("");
    toast.success("Live criada. Clique em Iniciar para transmitir.");
    if (data?.id) setActiveId(data.id);
    if (storeId) load(storeId);
  };

  const startLive = async (id: string) => {
    const { error } = await supabase.from("lives").update({ status: "live", started_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    setActiveId(id);
  };

  const endLive = async (id: string) => {
    const { error } = await supabase.from("lives").update({ status: "ended", ended_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    if (activeId === id) setActiveId(null);
  };

  const activeLive = lives?.find((l) => l.id === activeId) ?? null;

  return (
    <div className="space-y-6">
      {/* Criar nova live */}
      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Plus size={18} className="text-primary" />
          <h2 className="text-sm font-semibold">Nova transmissão</h2>
        </div>
        <form onSubmit={create} className="space-y-3">
          <div>
            <Label htmlFor="live-title" className="text-xs">Título da live</Label>
            <Input
              id="live-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Coleção nova de Verão"
              maxLength={120}
              className="mt-1"
            />
          </div>
          <Button type="submit" disabled={!title.trim() || creating} className="w-full">
            {creating ? <Loader2 className="animate-spin" size={16} /> : "Criar live"}
          </Button>
        </form>
      </section>

      {/* Painel de transmissão da live activa */}
      {activeLive && (
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">{activeLive.title}</h2>
              <p className="text-[11px] text-muted-foreground">Estado: {statusLabel(activeLive.status)}</p>
            </div>
            {activeLive.status !== "live" ? (
              <Button size="sm" onClick={() => startLive(activeLive.id)}>
                <Play size={14} className="mr-1" /> Iniciar live
              </Button>
            ) : (
              <Button size="sm" variant="destructive" onClick={() => endLive(activeLive.id)}>
                <Square size={14} className="mr-1" /> Encerrar
              </Button>
            )}
          </div>
          {activeLive.status === "live" && (
            <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" /></div>}>
              <LivePublisher liveId={activeLive.id} />
            </Suspense>
          )}
          <Link to="/live/$id" params={{ id: activeLive.id }} className="mt-3 inline-flex items-center gap-1 text-xs text-primary underline">
            Ver como espetador <ExternalLink size={11} />
          </Link>
        </section>
      )}

      {/* Lista */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Minhas lives</h2>
          <span className="text-xs text-muted-foreground">{lives?.length ?? 0} sessão(ões)</span>
        </div>
        {lives === null ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
        ) : lives.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Nenhuma live criada. Crie a sua primeira transmissão acima.
          </div>
        ) : (
          <ul className="space-y-2">
            {lives.map((l) => (
              <li key={l.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${l.status === "live" ? "bg-red-500 text-white" : "bg-muted text-muted-foreground"}`}>
                  <Radio size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{l.title}</p>
                  <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>{statusLabel(l.status)}</span>
                    {l.status === "live" && <><span>·</span><span className="flex items-center gap-1"><Users size={10} /> {l.viewer_count}</span></>}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  {l.status === "scheduled" && (
                    <Button size="sm" onClick={() => { setActiveId(l.id); startLive(l.id); }}>
                      <Play size={12} className="mr-1" /> Iniciar
                    </Button>
                  )}
                  {l.status === "live" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setActiveId(l.id)}>
                        Painel
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => endLive(l.id)}>
                        <Square size={12} className="mr-1" /> Parar
                      </Button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function statusLabel(s: Live["status"]) {
  if (s === "live") return "AO VIVO";
  if (s === "scheduled") return "Agendada";
  return "Encerrada";
}