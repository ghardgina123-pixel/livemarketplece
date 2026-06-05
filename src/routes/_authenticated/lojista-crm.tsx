import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Sparkles, Users, MessageSquare, BarChart3, Tag, Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/lojista-crm")({
  head: () => ({ meta: [{ title: "CRM Premium — Live Market" }] }),
  component: CRM,
});

const PRICE_AOA = 9900;

type Sub = { id: string; status: string; expires_at: string | null };

function CRM() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [sub, setSub] = useState<Sub | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    if (!user) return;
    const { data: s } = await supabase.from("stores").select("id").eq("owner_id", user.id).maybeSingle();
    if (!s) { setLoading(false); return; }
    setStoreId(s.id);
    const { data } = await supabase
      .from("store_subscriptions")
      .select("id, status, expires_at")
      .eq("store_id", s.id)
      .eq("plan", "crm")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setSub((data as Sub) ?? null);
    setLoading(false);
  };

  useEffect(() => { refresh();  }, [user?.id]);

  const subscribe = async () => {
    if (!storeId) return;
    setBusy(true);
    const { error } = await supabase.from("store_subscriptions").insert({
      store_id: storeId,
      plan: "crm",
      status: "pending",
      price_aoa: PRICE_AOA,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Assinatura solicitada! Envie o comprovativo para ativar.");
    refresh();
  };

  const active = sub?.status === "active" && (!sub.expires_at || new Date(sub.expires_at) > new Date());

  return (
    <AppShell>
      <header className="flex items-center gap-3 px-5 pt-6 pb-4 text-white" style={{ background: "var(--gradient-brand)" }}>
        <Link to="/lojista" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15"><ArrowLeft size={18} /></Link>
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-2">CRM Premium <Sparkles size={16} className="text-amber-300" /></h1>
          <p className="text-xs text-white/80">Ferramenta exclusiva para lojistas</p>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
      ) : !storeId ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-muted-foreground">Você precisa ter uma loja para assinar o CRM.</p>
          <Link to="/lojista" className="mt-4 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Abrir minha loja</Link>
        </div>
      ) : active ? (
        <ActiveView expiresAt={sub!.expires_at} />
      ) : (
        <Paywall sub={sub} onSubscribe={subscribe} busy={busy} />
      )}
    </AppShell>
  );
}

function ActiveView({ expiresAt }: { expiresAt: string | null }) {
  return (
    <div className="px-5 py-6">
      <div className="rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 p-5">
        <Sparkles className="text-orange-500" size={24} />
        <p className="mt-2 text-sm font-bold">CRM ativo</p>
        {expiresAt && <p className="text-xs text-muted-foreground">Renovação em {new Date(expiresAt).toLocaleDateString("pt-AO")}</p>}
      </div>
      <div className="mt-5 space-y-3">
        <Feature icon={<Users size={18} />} title="Meus clientes" desc="Lista completa com histórico de compras." />
        <Feature icon={<BarChart3 size={18} />} title="Relatórios" desc="Vendas, ticket médio, recompra." />
        <Feature icon={<MessageSquare size={18} />} title="Campanhas" desc="Mensagens em massa pelo chat." />
        <Feature icon={<Tag size={18} />} title="Segmentação" desc="Tags e notas internas por cliente." />
      </div>
      <div className="mt-6 rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
        Painel completo do CRM em construção.
      </div>
    </div>
  );
}

function Paywall({ sub, onSubscribe, busy }: { sub: Sub | null; onSubscribe: () => void; busy: boolean }) {
  const pending = sub?.status === "pending";
  return (
    <div className="px-5 py-6">
      <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-5 ring-1 ring-orange-200">
        <div className="flex items-center gap-2">
          <Sparkles className="text-orange-500" size={20} />
          <span className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">PRO</span>
        </div>
        <h2 className="mt-2 text-xl font-bold">Cresça sua loja com CRM</h2>
        <p className="mt-1 text-sm text-muted-foreground">Conheça seus clientes, fidelize e venda mais com mensagens segmentadas.</p>
        <p className="mt-3 text-2xl font-bold">Kz {PRICE_AOA.toLocaleString("pt-AO")}<span className="text-sm font-normal text-muted-foreground"> / mês</span></p>
      </div>

      <div className="mt-5 space-y-3">
        <Feature icon={<Users size={18} />} title="Base de clientes" desc="Veja quem comprou, quando e o quê." />
        <Feature icon={<BarChart3 size={18} />} title="Relatórios e métricas" desc="Acompanhe o desempenho da loja." />
        <Feature icon={<MessageSquare size={18} />} title="Campanhas no chat" desc="Envie ofertas para grupos de clientes." />
        <Feature icon={<Tag size={18} />} title="Tags e notas" desc="Organize e segmente sua carteira." />
      </div>

      <Button
        onClick={onSubscribe}
        disabled={busy || pending}
        className="mt-6 h-12 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-base font-bold text-white shadow-md hover:opacity-95"
      >
        {busy ? <Loader2 className="animate-spin" /> : pending ? "Aguardando confirmação do pagamento" : "Assinar CRM Premium"}
      </Button>
      {pending && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Pague usando um dos métodos locais (Express, e-Kwanza, Unitel Money, Afrimoney, Kwik ou Referência Multicaixa) e envie o comprovativo no chat de suporte.
        </p>
      )}
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border p-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">{icon}</div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}