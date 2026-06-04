import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Plus, MapPin, Trash2, Loader2, Star } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/enderecos")({
  head: () => ({ meta: [{ title: "Meus endereços — Live Market" }] }),
  component: AddressesPage,
});

type Province = { id: string; name: string };
type Municipality = { id: string; name: string; province_id: string; shipping_fee_aoa: number };
type Address = {
  id: string; label: string; street: string; district: string | null; reference: string | null;
  recipient_name: string | null; phone: string | null; is_default: boolean;
  province_id: string; municipality_id: string;
  provinces: { name: string } | null;
  municipalities: { name: string; shipping_fee_aoa: number } | null;
};

function AddressesPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("addresses")
      .select("*, provinces(name), municipalities(name, shipping_fee_aoa)")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    setItems((data as Address[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const setDefault = async (id: string) => {
    if (!user) return;
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
    await supabase.from("addresses").update({ is_default: true }).eq("id", id);
    toast.success("Endereço padrão atualizado");
    load();
  };

  const del = async (id: string) => {
    if (!confirm("Excluir este endereço?")) return;
    const { error } = await supabase.from("addresses").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Endereço excluído");
    load();
  };

  return (
    <AppShell>
      <header className="flex items-center gap-3 px-5 pt-6 pb-4 text-white" style={{ background: "var(--gradient-brand)" }}>
        <Link to="/perfil" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">Meus endereços</h1>
          <p className="text-xs text-white/80">Para entrega rápida em Angola</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15"><Plus size={18} /></button>
          </DialogTrigger>
          <DialogContent className="max-w-[420px]">
            <DialogHeader><DialogTitle>Novo endereço</DialogTitle></DialogHeader>
            <AddressForm onDone={() => { setOpen(false); load(); }} />
          </DialogContent>
        </Dialog>
      </header>

      <div className="px-5 py-4">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <MapPin className="mx-auto text-muted-foreground" size={28} />
            <p className="mt-3 text-sm font-semibold">Nenhum endereço cadastrado</p>
            <p className="mt-1 text-xs text-muted-foreground">Adicione um endereço para finalizar suas compras</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((a) => (
              <li key={a.id} className="rounded-2xl border border-border p-4">
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="mt-1 text-primary" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{a.label}</p>
                      {a.is_default && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">Padrão</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">{a.street}{a.district ? `, ${a.district}` : ""}</p>
                    <p className="text-xs text-muted-foreground">{a.municipalities?.name} · {a.provinces?.name}</p>
                    {a.recipient_name && <p className="mt-1 text-[11px] text-muted-foreground">{a.recipient_name} · {a.phone}</p>}
                    <p className="mt-1 text-[11px] font-semibold text-primary">
                      Frete: Kz {Number(a.municipalities?.shipping_fee_aoa ?? 0).toLocaleString("pt-AO")}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  {!a.is_default && (
                    <Button variant="outline" size="sm" onClick={() => setDefault(a.id)}>
                      <Star size={14} /> Tornar padrão
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => del(a.id)}>
                    <Trash2 size={14} className="text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}

function AddressForm({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [munis, setMunis] = useState<Municipality[]>([]);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    label: "Casa", province_id: "", municipality_id: "", district: "",
    street: "", reference: "", recipient_name: "", phone: "",
  });

  useEffect(() => {
    supabase.from("provinces").select("*").order("name").then(({ data }) => setProvinces((data as Province[]) ?? []));
  }, []);

  useEffect(() => {
    if (!form.province_id) { setMunis([]); return; }
    supabase.from("municipalities").select("*").eq("province_id", form.province_id).order("name")
      .then(({ data }) => setMunis((data as Municipality[]) ?? []));
  }, [form.province_id]);

  const selectedMuni = munis.find((m) => m.id === form.municipality_id);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.province_id || !form.municipality_id || !form.street.trim()) {
      return toast.error("Província, município e rua são obrigatórios");
    }
    setBusy(true);
    const { count } = await supabase.from("addresses").select("*", { count: "exact", head: true }).eq("user_id", user.id);
    const isFirst = (count ?? 0) === 0;
    const { error } = await supabase.from("addresses").insert({
      user_id: user.id,
      label: form.label || "Casa",
      province_id: form.province_id,
      municipality_id: form.municipality_id,
      district: form.district || null,
      street: form.street,
      reference: form.reference || null,
      recipient_name: form.recipient_name || null,
      phone: form.phone || null,
      is_default: isFirst,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Endereço salvo");
    onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Identificação</Label>
        <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Casa / Trabalho" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Província *</Label>
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.province_id}
            onChange={(e) => setForm({ ...form, province_id: e.target.value, municipality_id: "" })}
          >
            <option value="">Selecione…</option>
            {provinces.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Município *</Label>
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.municipality_id}
            onChange={(e) => setForm({ ...form, municipality_id: e.target.value })}
            disabled={!form.province_id}
          >
            <option value="">Selecione…</option>
            {munis.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      </div>
      {selectedMuni && (
        <div className="rounded-lg bg-accent/50 px-3 py-2 text-[11px] text-accent-foreground">
          Frete estimado para {selectedMuni.name}: <strong>Kz {Number(selectedMuni.shipping_fee_aoa).toLocaleString("pt-AO")}</strong>
        </div>
      )}
      <div className="space-y-1.5">
        <Label className="text-xs">Bairro / Distrito</Label>
        <Input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} placeholder="Ex: Benfica" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Rua / Avenida *</Label>
        <Input value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} placeholder="Rua, número, casa…" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Ponto de referência</Label>
        <Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="Perto de…" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Destinatário</Label>
          <Input value={form.recipient_name} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Telefone</Label>
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+244 …" />
        </div>
      </div>
      <Button type="submit" disabled={busy} className="w-full">
        {busy ? <Loader2 className="animate-spin" /> : "Salvar endereço"}
      </Button>
    </form>
  );
}