import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Loader2, Trash2, Pencil, Clock, CheckCircle2, XCircle } from "lucide-react";
import { LojistaShell, useLojistaStore } from "@/components/LojistaShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(200, "Nome muito longo"),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  price_aoa: z.number().positive("Preço inválido").max(100_000_000),
  stock: z.number().int().min(0).max(1_000_000),
});

export const Route = createFileRoute("/_authenticated/lojista/produtos")({
  head: () => ({ meta: [{ title: "Produtos — Lojista" }] }),
  component: () => (
    <LojistaShell title="Produtos">
      <Produtos />
    </LojistaShell>
  ),
});

type Product = {
  id: string;
  name: string;
  description: string | null;
  price_aoa: number;
  stock: number;
  status: string;
  image_url: string | null;
  rejection_reason: string | null;
};

function Produtos() {
  const { store } = useLojistaStore();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const load = async () => {
    if (!store) return;
    const { data } = await supabase.from("products").select("*").eq("store_id", store.id).order("created_at", { ascending: false });
    setItems((data as Product[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [store?.id]);

  const del = async (id: string) => {
    if (!confirm("Excluir este produto?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Produto excluído");
    load();
  };

  if (!store) return null;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold">{items.length} produto(s)</h2>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => setEditing(null)}><Plus size={16} /> Novo</Button>
          </DialogTrigger>
          <DialogContent className="max-w-[420px]">
            <DialogHeader><DialogTitle>{editing ? "Editar produto" : "Novo produto"}</DialogTitle></DialogHeader>
            <ProductForm storeId={store.id} initial={editing} onDone={() => { setOpen(false); setEditing(null); load(); }} />
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
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent text-xl overflow-hidden">
                {p.image_url ? <img src={p.image_url} alt="" className="h-full w-full object-cover" /> : "📦"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold">{p.name}</p>
                <p className="text-xs text-muted-foreground">Kz {Number(p.price_aoa).toLocaleString("pt-AO")} · Estoque {p.stock}</p>
                <StatusBadge status={p.status} />
                {p.status === "rejected" && p.rejection_reason && (
                  <p className="mt-1 text-[10px] text-destructive">Motivo: {p.rejection_reason}</p>
                )}
              </div>
              <button onClick={() => { setEditing(p); setOpen(true); }} className="text-muted-foreground p-1" aria-label="Editar"><Pencil size={16} /></button>
              <button onClick={() => del(p.id)} className="text-destructive p-1" aria-label="Excluir"><Trash2 size={16} /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProductForm({ storeId, initial, onDone }: { storeId: string; initial: Product | null; onDone: () => void }) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    price_aoa: initial ? String(initial.price_aoa) : "",
    stock: initial ? String(initial.stock) : "1",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceAoa = Number(form.price_aoa);
    const stock = Number(form.stock);
    const parsed = productSchema.safeParse({ name: form.name, description: form.description, price_aoa: priceAoa, stock });
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
    setBusy(true);
    try {
      let image_url = initial?.image_url ?? null;
      if (imageFile) {
        const { data: u } = await supabase.auth.getUser();
        if (!u.user) throw new Error("Não autenticado");
        const ext = imageFile.name.split(".").pop() || "png";
        const path = `${u.user.id}/${storeId}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("product-images").upload(path, imageFile, { upsert: true, contentType: imageFile.type });
        if (upErr) throw upErr;
        const { data: signed, error: sErr } = await supabase.storage.from("product-images").createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
        if (sErr) throw sErr;
        image_url = signed.signedUrl;
      }
      const payload = {
        name: parsed.data.name,
        description: parsed.data.description || null,
        price_aoa: parsed.data.price_aoa,
        price_brl: Math.round((parsed.data.price_aoa / 175) * 100) / 100,
        stock: parsed.data.stock,
        image_url,
      };
      if (initial) {
        const { error } = await supabase.from("products").update({ ...payload, status: "pending", rejection_reason: null }).eq("id", initial.id);
        if (error) throw error;
        toast.success("Produto atualizado — reenviado para aprovação");
      } else {
        const { error } = await supabase.from("products").insert({ ...payload, store_id: storeId });
        if (error) throw error;
        toast.success("Produto enviado para aprovação");
      }
      onDone();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Nome *"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
      <Field label="Descrição"><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Preço (Kz) *"><Input type="number" step="1" value={form.price_aoa} onChange={(e) => setForm({ ...form, price_aoa: e.target.value })} /></Field>
        <Field label="Estoque"><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></Field>
      </div>
      <Field label="Imagem">
        <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
      </Field>
      <Button type="submit" disabled={busy} className="w-full">{busy ? <Loader2 className="animate-spin" /> : initial ? "Salvar alterações" : "Cadastrar"}</Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: typeof Clock }> = {
    pending: { label: "Aguardando", cls: "bg-yellow-100 text-yellow-800", icon: Clock },
    approved: { label: "Aprovado", cls: "bg-green-100 text-green-800", icon: CheckCircle2 },
    rejected: { label: "Rejeitado", cls: "bg-red-100 text-red-800", icon: XCircle },
  };
  const s = map[status] || { label: status, cls: "bg-muted text-foreground", icon: Clock };
  const Icon = s.icon;
  return <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.cls}`}><Icon size={10} /> {s.label}</span>;
}

function Empty({ label }: { label: string }) {
  return <div className="rounded-xl border border-dashed border-border py-10 text-center text-xs text-muted-foreground">{label}</div>;
}