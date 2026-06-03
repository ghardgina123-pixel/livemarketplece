import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Package, ShoppingBag, Wallet, Radio, Loader2, Trash2, Clock, CheckCircle2, XCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/lojista")({
  head: () => ({ meta: [{ title: "Painel do Lojista — Live Market" }] }),
  component: Lojista,
});

type Store = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  category: string | null;
  logo_url: string | null;
  cover_url: string | null;
  nif: string | null;
  phone: string | null;
  bank_name: string | null;
  bank_account: string | null;
  bank_holder: string | null;
  status: "pending" | "active" | "rejected";
  rejection_reason: string | null;
};

function Lojista() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<Store | null>(null);

  const refresh = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("stores")
      .select("*")
      .eq("owner_id", user.id)
      .maybeSingle();
    setStore((data as Store) ?? null);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
     
  }, [user?.id]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <header className="flex items-center gap-3 px-5 pt-6 pb-4 text-white" style={{ background: "var(--gradient-brand)" }}>
        <Link to="/perfil" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-lg font-semibold">Painel do Lojista</h1>
          <p className="text-xs text-white/80">{store ? store.name : "Cadastre sua loja"}</p>
        </div>
      </header>

      {!store && <StoreRegistration onCreated={refresh} />}
      {store?.status === "pending" && <PendingState reason={null} />}
      {store?.status === "rejected" && <PendingState reason={store.rejection_reason} rejected />}
      {store?.status === "active" && <Dashboard store={store} />}
    </AppShell>
  );
}

function PendingState({ reason, rejected }: { reason: string | null; rejected?: boolean }) {
  return (
    <div className="px-5 py-10 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
        {rejected ? <XCircle className="text-destructive" size={32} /> : <Clock className="text-primary" size={32} />}
      </div>
      <h2 className="text-lg font-bold">{rejected ? "Loja rejeitada" : "Aguardando aprovação"}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {rejected
          ? reason || "Sua loja foi rejeitada. Entre em contato com o suporte."
          : "Sua loja foi enviada para análise. Você receberá uma notificação assim que for aprovada."}
      </p>
    </div>
  );
}

function StoreRegistration({ onCreated }: { onCreated: () => void }) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "Moda",
    nif: "",
    phone: "",
    bank_name: "",
    bank_account: "",
    bank_holder: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.name.trim()) return toast.error("Nome da loja é obrigatório");
    setSubmitting(true);
    const slug = form.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const { error } = await supabase.from("stores").insert({
      owner_id: user.id,
      name: form.name.trim(),
      slug,
      description: form.description || null,
      category: form.category || null,
      nif: form.nif || null,
      phone: form.phone || null,
      bank_name: form.bank_name || null,
      bank_account: form.bank_account || null,
      bank_holder: form.bank_holder || null,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);

    // Promote user to seller role
    await supabase.from("user_roles").insert({ user_id: user.id, role: "seller" });

    toast.success("Loja enviada para aprovação!");
    onCreated();
  };

  return (
    <form onSubmit={submit} className="space-y-4 px-5 py-5">
      <div className="rounded-2xl bg-accent/50 p-4 text-xs text-muted-foreground">
        Preencha os dados da sua loja. Após análise da equipe Live Market, sua loja ficará ativa e você poderá publicar produtos e iniciar lives.
      </div>

      <Field label="Nome da loja *">
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Boutique Luanda" />
      </Field>
      <Field label="Descrição">
        <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Sobre a sua loja..." rows={3} />
      </Field>
      <Field label="Categoria">
        <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          {["Moda", "Beleza", "Eletrônicos", "Casa", "Alimentos", "Esportes", "Outros"].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </Field>

      <h3 className="pt-2 text-xs font-bold uppercase text-muted-foreground">Dados Fiscais</h3>
      <Field label="NIF / Identificação fiscal">
        <Input value={form.nif} onChange={(e) => setForm({ ...form, nif: e.target.value })} />
      </Field>
      <Field label="Telefone de contato">
        <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+244 ..." />
      </Field>

      <h3 className="pt-2 text-xs font-bold uppercase text-muted-foreground">Dados Bancários (para repasses)</h3>
      <Field label="Banco">
        <Input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} placeholder="Ex: BAI, BFA, BIC..." />
      </Field>
      <Field label="IBAN / Número da conta">
        <Input value={form.bank_account} onChange={(e) => setForm({ ...form, bank_account: e.target.value })} />
      </Field>
      <Field label="Titular da conta">
        <Input value={form.bank_holder} onChange={(e) => setForm({ ...form, bank_holder: e.target.value })} />
      </Field>

      <Button type="submit" disabled={submitting} className="h-12 w-full">
        {submitting ? <Loader2 className="animate-spin" /> : "Enviar para aprovação"}
      </Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function Dashboard({ store }: { store: Store }) {
  return (
    <Tabs defaultValue="produtos" className="w-full">
      <TabsList className="mx-5 mt-4 grid grid-cols-4">
        <TabsTrigger value="produtos"><Package size={14} /></TabsTrigger>
        <TabsTrigger value="pedidos"><ShoppingBag size={14} /></TabsTrigger>
        <TabsTrigger value="repasses"><Wallet size={14} /></TabsTrigger>
        <TabsTrigger value="live"><Radio size={14} /></TabsTrigger>
      </TabsList>
      <TabsContent value="produtos"><ProductsTab storeId={store.id} /></TabsContent>
      <TabsContent value="pedidos"><OrdersTab storeId={store.id} /></TabsContent>
      <TabsContent value="repasses"><PayoutsTab storeId={store.id} /></TabsContent>
      <TabsContent value="live"><LiveTab store={store} /></TabsContent>
    </Tabs>
  );
}

type Product = { id: string; name: string; description: string | null; price_brl: number; stock: number; status: string; rejection_reason: string | null; image_url: string | null };

function ProductsTab({ storeId }: { storeId: string }) {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("products").select("*").eq("store_id", storeId).order("created_at", { ascending: false });
    setItems((data as Product[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load();  }, [storeId]);

  const del = async (id: string) => {
    if (!confirm("Excluir este produto?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Produto excluído");
    load();
  };

  return (
    <div className="px-5 py-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold">Meus produtos ({items.length})</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus size={16} /> Novo</Button>
          </DialogTrigger>
          <DialogContent className="max-w-[420px]">
            <DialogHeader><DialogTitle>Novo produto</DialogTitle></DialogHeader>
            <ProductForm storeId={storeId} onDone={() => { setOpen(false); load(); }} />
          </DialogContent>
        </Dialog>
      </div>
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <Empty label="Nenhum produto. Adicione o primeiro!" />
      ) : (
        <ul className="space-y-2">
          {items.map((p) => (
            <li key={p.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent text-xl">📦</div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold">{p.name}</p>
                <p className="text-xs text-muted-foreground">R$ {Number(p.price_brl).toFixed(2)} · Estoque {p.stock}</p>
                <StatusBadge status={p.status} />
              </div>
              <button onClick={() => del(p.id)} className="text-destructive"><Trash2 size={16} /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProductForm({ storeId, onDone }: { storeId: string; onDone: () => void }) {
  const [form, setForm] = useState({ name: "", description: "", price_brl: "", stock: "1" });
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price_brl) return toast.error("Nome e preço obrigatórios");
    setBusy(true);
    const { error } = await supabase.from("products").insert({
      store_id: storeId,
      name: form.name,
      description: form.description || null,
      price_brl: Number(form.price_brl),
      stock: Number(form.stock) || 0,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Produto enviado para aprovação");
    onDone();
  };
  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Nome *"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
      <Field label="Descrição"><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Preço (R$) *"><Input type="number" step="0.01" value={form.price_brl} onChange={(e) => setForm({ ...form, price_brl: e.target.value })} /></Field>
        <Field label="Estoque"><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></Field>
      </div>
      <Button type="submit" disabled={busy} className="w-full">{busy ? <Loader2 className="animate-spin" /> : "Cadastrar"}</Button>
    </form>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: typeof Clock }> = {
    pending: { label: "Aguardando", cls: "bg-yellow-100 text-yellow-800", icon: Clock },
    approved: { label: "Aprovado", cls: "bg-green-100 text-green-800", icon: CheckCircle2 },
    rejected: { label: "Rejeitado", cls: "bg-red-100 text-red-800", icon: XCircle },
    active: { label: "Ativa", cls: "bg-green-100 text-green-800", icon: CheckCircle2 },
    paid: { label: "Pago", cls: "bg-green-100 text-green-800", icon: CheckCircle2 },
    released: { label: "Liberado", cls: "bg-green-100 text-green-800", icon: CheckCircle2 },
  };
  const s = map[status] || { label: status, cls: "bg-muted text-foreground", icon: Clock };
  const Icon = s.icon;
  return <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.cls}`}><Icon size={10} /> {s.label}</span>;
}

type Order = { id: string; total_brl: number; status: string; created_at: string; customer_id: string };

function OrdersTab({ storeId }: { storeId: string }) {
  const [items, setItems] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from("orders").select("*").eq("store_id", storeId).order("created_at", { ascending: false }).then(({ data }) => {
      setItems((data as Order[]) ?? []);
      setLoading(false);
    });
  }, [storeId]);
  return (
    <div className="px-5 py-4">
      <h2 className="mb-3 text-sm font-bold">Pedidos ({items.length})</h2>
      {loading ? <Loader2 className="animate-spin text-primary" /> : items.length === 0 ? <Empty label="Nenhum pedido ainda." /> : (
        <ul className="space-y-2">
          {items.map((o) => (
            <li key={o.id} className="rounded-xl border border-border p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-mono text-muted-foreground">#{o.id.slice(0, 8)}</p>
                <StatusBadge status={o.status} />
              </div>
              <p className="mt-1 text-sm font-bold">R$ {Number(o.total_brl).toFixed(2)}</p>
              <p className="text-[10px] text-muted-foreground">{new Date(o.created_at).toLocaleString("pt-BR")}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type Payout = { id: string; gross_brl: number; net_brl: number; commission_pct: number; status: string; release_at: string; released_at: string | null };

function PayoutsTab({ storeId }: { storeId: string }) {
  const [items, setItems] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from("payouts").select("*").eq("store_id", storeId).order("created_at", { ascending: false }).then(({ data }) => {
      setItems((data as Payout[]) ?? []);
      setLoading(false);
    });
  }, [storeId]);
  const totalNet = items.filter((p) => p.status === "released").reduce((s, p) => s + Number(p.net_brl), 0);
  return (
    <div className="px-5 py-4">
      <div className="mb-4 rounded-2xl p-4 text-white" style={{ background: "var(--gradient-brand)" }}>
        <p className="text-xs opacity-80">Total recebido</p>
        <p className="text-2xl font-bold">R$ {totalNet.toFixed(2)}</p>
      </div>
      <h2 className="mb-3 text-sm font-bold">Repasses ({items.length})</h2>
      {loading ? <Loader2 className="animate-spin text-primary" /> : items.length === 0 ? <Empty label="Nenhum repasse ainda." /> : (
        <ul className="space-y-2">
          {items.map((p) => (
            <li key={p.id} className="rounded-xl border border-border p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold">R$ {Number(p.net_brl).toFixed(2)}</p>
                <StatusBadge status={p.status} />
              </div>
              <p className="text-[10px] text-muted-foreground">
                Bruto R$ {Number(p.gross_brl).toFixed(2)} · Comissão {p.commission_pct}%
              </p>
              <p className="text-[10px] text-muted-foreground">
                {p.released_at ? `Liberado em ${new Date(p.released_at).toLocaleString("pt-BR")}` : `Libera em ${new Date(p.release_at).toLocaleString("pt-BR")}`}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LiveTab({ store }: { store: Store }) {
  return (
    <div className="px-5 py-4">
      <div className="rounded-2xl border border-dashed border-border p-6 text-center">
        <Radio size={32} className="mx-auto text-primary" />
        <h2 className="mt-3 text-base font-bold">Iniciar Live</h2>
        <p className="mt-2 text-xs text-muted-foreground">
          Em breve você poderá transmitir ao vivo direto do app e vender em tempo real. Estamos integrando o serviço de streaming.
        </p>
        <Button disabled className="mt-4">Em breve</Button>
      </div>
      <p className="mt-4 text-center text-[10px] text-muted-foreground">Loja: {store.name}</p>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <div className="rounded-xl border border-dashed border-border py-10 text-center text-xs text-muted-foreground">{label}</div>;
}