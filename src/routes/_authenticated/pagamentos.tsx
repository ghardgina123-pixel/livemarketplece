import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, CreditCard, Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/pagamentos")({
  head: () => ({ meta: [{ title: "Métodos de pagamento — Live Market" }] }),
  component: Pagamentos,
});

type Method = { id: string; display_name: string; description: string | null; method_type: string; is_cash_on_delivery: boolean };

function Pagamentos() {
  const [items, setItems] = useState<Method[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("payment_methods").select("id, display_name, description, method_type, is_cash_on_delivery")
      .eq("is_active", true).order("sort_order")
      .then(({ data }) => { setItems((data as Method[]) ?? []); setLoading(false); });
  }, []);

  return (
    <AppShell>
      <header className="flex items-center gap-3 px-5 pt-6 pb-4 text-white" style={{ background: "var(--gradient-brand)" }}>
        <Link to="/perfil" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15"><ArrowLeft size={18} /></Link>
        <h1 className="text-lg font-semibold">Métodos de pagamento</h1>
      </header>
      <div className="px-5 py-5">
        <p className="mb-3 text-xs text-muted-foreground">Métodos disponíveis no checkout (Angola):</p>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
        ) : (
          <ul className="space-y-2">
            {items.map((m) => (
              <li key={m.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent"><CreditCard size={16} /></div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{m.display_name}</p>
                  {m.description && <p className="text-[11px] text-muted-foreground">{m.description}</p>}
                </div>
                {m.is_cash_on_delivery && <span className="rounded-full bg-accent px-2 py-0.5 text-[9px] font-bold uppercase">Na entrega</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}