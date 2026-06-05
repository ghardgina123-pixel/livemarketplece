import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Sparkles, Users, MessageSquare, BarChart3, Tag, Loader2, Upload, CheckCircle2, XCircle, Clock, FileCheck2 } from "lucide-react";
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

type Sub = {
  id: string;
  status: string;
  expires_at: string | null;
  started_at: string | null;
  payment_method: string | null;
  proof_url: string | null;
  rejection_reason: string | null;
};

const PAYMENT_METHODS = [
  { value: "express", label: "Express (Multicaixa)" },
  { value: "ekwanza", label: "e-Kwanza" },
  { value: "unitel_money", label: "Unitel Money" },
  { value: "afrimoney", label: "Afrimoney" },
  { value: "kwik", label: "Kwik" },
  { value: "multicaixa_ref", label: "Referência Multicaixa" },
];

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
      .select("id, status, expires_at, started_at, payment_method, proof_url, rejection_reason")
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
    toast.success("Assinatura criada! Agora envie o comprovativo.");
    refresh();
  };

  const active = sub?.status === "active" && (!sub.expires_at || new Date(sub.expires_at) > new Date());
  const expired = sub?.status === "active" && sub.expires_at && new Date(sub.expires_at) <= new Date();

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
      ) : active && !expired ? (
        <ActiveView expiresAt={sub!.expires_at} />
      ) : sub && sub.status === "pending" ? (
        <PendingView sub={sub} storeId={storeId} onRefresh={refresh} />
      ) : sub && sub.status === "rejected" ? (
        <RejectedView sub={sub} storeId={storeId} onRefresh={refresh} />
      ) : (
        <Paywall onSubscribe={subscribe} busy={busy} expired={!!expired} />
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

function Paywall({ onSubscribe, busy, expired }: { onSubscribe: () => void; busy: boolean; expired: boolean }) {
  return (
    <div className="px-5 py-6">
      {expired && (
        <div className="mb-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
          Sua assinatura expirou. Renove para continuar a usar o CRM.
        </div>
      )}
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
        disabled={busy}
        className="mt-6 h-12 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-base font-bold text-white shadow-md hover:opacity-95"
      >
        {busy ? <Loader2 className="animate-spin" /> : expired ? "Renovar assinatura" : "Assinar CRM Premium"}
      </Button>
    </div>
  );
}

function PendingView({ sub, storeId, onRefresh }: { sub: Sub; storeId: string; onRefresh: () => void }) {
  const hasProof = !!sub.proof_url;
  return (
    <div className="px-5 py-6 space-y-5">
      <StatusBanner
        tone="pending"
        icon={<Clock size={18} />}
        title={hasProof ? "Aguardando confirmação" : "Envie o comprovativo"}
        desc={hasProof
          ? "Recebemos seu comprovativo. A nossa equipa irá validar em até 24h."
          : "Realize o pagamento de Kz " + PRICE_AOA.toLocaleString("pt-AO") + " e anexe o comprovativo abaixo."}
      />
      <PaymentForm sub={sub} storeId={storeId} onSaved={onRefresh} />
    </div>
  );
}

function RejectedView({ sub, storeId, onRefresh }: { sub: Sub; storeId: string; onRefresh: () => void }) {
  return (
    <div className="px-5 py-6 space-y-5">
      <StatusBanner
        tone="rejected"
        icon={<XCircle size={18} />}
        title="Comprovativo recusado"
        desc={sub.rejection_reason || "O comprovativo enviado não foi aceite. Por favor, envie um novo."}
      />
      <PaymentForm sub={sub} storeId={storeId} onSaved={onRefresh} forceResubmit />
    </div>
  );
}

function StatusBanner({ tone, icon, title, desc }: { tone: "pending" | "rejected"; icon: React.ReactNode; title: string; desc: string }) {
  const cls = tone === "pending"
    ? "bg-amber-50 ring-amber-200 text-amber-900"
    : "bg-red-50 ring-red-200 text-red-900";
  return (
    <div className={`flex gap-3 rounded-2xl p-4 ring-1 ${cls}`}>
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-xs opacity-90">{desc}</p>
      </div>
    </div>
  );
}

function PaymentForm({ sub, storeId, onSaved, forceResubmit }: { sub: Sub; storeId: string; onSaved: () => void; forceResubmit?: boolean }) {
  const [method, setMethod] = useState(sub.payment_method ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = async () => {
    if (!method) return toast.error("Selecione o método de pagamento");
    if (!file && (!sub.proof_url || forceResubmit)) return toast.error("Anexe o comprovativo");
    setBusy(true);
    try {
      let proofUrl = sub.proof_url;
      if (file) {
        const ext = file.name.split(".").pop() ?? "bin";
        const path = `${storeId}/${sub.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("subscription-proofs")
          .upload(path, file, { upsert: true, contentType: file.type });
        if (upErr) throw upErr;
        proofUrl = path;
      }
      // Se foi rejeitada, reabrir como pending para nova analise
      const patch: {
        payment_method: string;
        proof_url: string | null;
        status?: string;
        rejection_reason?: string | null;
      } = { payment_method: method, proof_url: proofUrl };
      if (sub.status === "rejected") {
        patch.status = "pending";
        patch.rejection_reason = null;
      }
      const { error } = await supabase
        .from("store_subscriptions")
        .update(patch)
        .eq("id", sub.id);
      if (error) throw error;
      toast.success("Comprovativo enviado! Aguarde validação.");
      setFile(null);
      onSaved();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border p-4">
      <div>
        <label className="text-xs font-semibold text-muted-foreground">Método de pagamento</label>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
        >
          <option value="">Selecione…</option>
          {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground">Comprovativo (imagem ou PDF)</label>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm"
        >
          <Upload size={16} />
          {file ? file.name : sub.proof_url && !forceResubmit ? "Substituir comprovativo" : "Anexar ficheiro"}
        </button>
        {sub.proof_url && !file && (
          <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
            <FileCheck2 size={12} /> Comprovativo anterior em análise.
          </p>
        )}
      </div>

      <Button
        onClick={submit}
        disabled={busy}
        className="h-11 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 font-semibold text-white"
      >
        {busy ? <Loader2 className="animate-spin" /> : "Enviar para análise"}
      </Button>

      <p className="text-[11px] text-muted-foreground">
        Após validação pela equipa Live Market, o acesso ao CRM será ativado automaticamente.
      </p>
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