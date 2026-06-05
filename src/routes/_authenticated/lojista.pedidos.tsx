import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Clock, CheckCircle2, Package, Truck, XCircle } from "lucide-react";
import { LojistaShell, useLojistaStore } from "@/components/LojistaShell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/lojista/pedidos")({
  head: () => ({ meta: [{ title: "Pedidos — Lojista" }] }),
  component: () => (
    <LojistaShell title="Pedidos">
      <Pedidos />
    </LojistaShell>
  ),
});

type OrderStatus = "pending" | "paid" | "preparing" | "shipped" | "delivered" | "cancelled";
type Order = {
  id: string;
  total_aoa: number;
  status: OrderStatus;
  payment_method: string | null;
  created_at: string;
  customer_id: string;
};

const STATUS_META: Record<OrderStatus, { label: string; cls: string; icon: typeof Clock }> = {
  pending: { label: "Pendente", cls: "bg-yellow-100 text-yellow-800", icon: Clock },
  paid: { label: "Pago", cls: "bg-blue-100 text-blue-800", icon: CheckCircle2 },
  preparing: { label: "Preparando", cls: "bg-indigo-100 text-indigo-800", icon: Package },
  shipped: { label: "Enviado", cls: "bg-purple-100 text-purple-800", icon: Truck },
  delivered: { label: "Entregue", cls: "bg-green-100 text-green-800", icon: CheckCircle2 },
  cancelled: { label: "Cancelado", cls: "bg-red-100 text-red-800", icon: XCircle },
};

const NEXT: Record<OrderStatus, OrderStatus[]> = {
  pending: ["paid", "cancelled"],
  paid: ["preparing", "cancelled"],
  preparing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

function Pedidos() {
  const { store } = useLojistaStore();
  const [items, setItems] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = async () => {
    if (!store) return;
    const { data } = await supabase
      .from("orders")
      .select("id, total_aoa, status, payment_method, created_at, customer_id")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false });
    setItems((data as Order[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [store?.id]);

  const updateStatus = async (id: string, next: OrderStatus) => {
    setUpdating(id);
    const { error } = await supabase.from("orders").update({ status: next }).eq("id", id);
    setUpdating(null);
    if (error) return toast.error(error.message);
    toast.success(`Pedido atualizado: ${STATUS_META[next].label}`);
    setItems((prev) => prev.map((o) => (o.id === id ? { ...o, status: next } : o)));
  };

  if (!store) return null;

  return (
    <div>
      <h2 className="mb-3 text-sm font-bold">{items.length} pedido(s)</h2>
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <Empty label="Nenhum pedido ainda." />
      ) : (
        <ul className="space-y-3">
          {items.map((o) => {
            const meta = STATUS_META[o.status];
            const Icon = meta.icon;
            const options = NEXT[o.status];
            return (
              <li key={o.id} className="rounded-xl border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-mono text-muted-foreground">#{o.id.slice(0, 8)}</p>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.cls}`}>
                    <Icon size={10} /> {meta.label}
                  </span>
                </div>
                <p className="mt-1 text-sm font-bold">Kz {Number(o.total_aoa).toLocaleString("pt-AO")}</p>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(o.created_at).toLocaleString("pt-BR")}
                  {o.payment_method && <> · {o.payment_method}</>}
                </p>
                {options.length > 0 && (
                  <div className="mt-3 flex items-center gap-2">
                    <Select
                      disabled={updating === o.id}
                      onValueChange={(v) => updateStatus(o.id, v as OrderStatus)}
                    >
                      <SelectTrigger className="h-9 flex-1 text-xs">
                        <SelectValue placeholder="Alterar status..." />
                      </SelectTrigger>
                      <SelectContent>
                        {options.map((s) => (
                          <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {updating === o.id && <Loader2 size={14} className="animate-spin text-primary" />}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <div className="rounded-xl border border-dashed border-border py-10 text-center text-xs text-muted-foreground">{label}</div>;
}