import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, BarChart3, Package, ShoppingBag, Menu, Wallet, Radio, Settings } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type LojistaStore = {
  id: string;
  name: string;
  status: "pending" | "active" | "rejected";
  logo_url: string | null;
  cover_url: string | null;
  rejection_reason: string | null;
};

const NAV = [
  { to: "/lojista/dashboard", label: "Visão geral", icon: BarChart3 },
  { to: "/lojista/produtos", label: "Produtos", icon: Package },
  { to: "/lojista/pedidos", label: "Pedidos", icon: ShoppingBag },
  { to: "/lojista-crm", label: "CRM Premium", icon: Wallet },
] as const;

export function useLojistaStore() {
  const { user } = useAuth();
  const [store, setStore] = useState<LojistaStore | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!user) return;
    supabase
      .from("stores")
      .select("id, name, status, logo_url, cover_url, rejection_reason")
      .eq("owner_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setStore((data as LojistaStore) ?? null);
        setLoading(false);
      });
  }, [user?.id]);
  return { store, loading };
}

export function LojistaShell({ title, children }: { title: string; children: ReactNode }) {
  const { store, loading } = useLojistaStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!store || store.status !== "active") {
      navigate({ to: "/lojista" });
    }
  }, [loading, store, navigate]);

  if (loading || !store || store.status !== "active") {
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
        <Sheet>
          <SheetTrigger asChild>
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15" aria-label="Menu do lojista">
              <Menu size={18} />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[260px] p-0">
            <SheetHeader className="border-b p-4 text-left">
              <SheetTitle className="text-base">{store.name}</SheetTitle>
              <p className="text-xs text-muted-foreground">Painel do Lojista</p>
            </SheetHeader>
            <nav className="p-2">
              {NAV.map((item) => {
                const active = pathname === item.to || pathname.startsWith(item.to + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${active ? "bg-primary text-primary-foreground font-semibold" : "text-foreground hover:bg-accent"}`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
              <div className="my-2 border-t" />
              <Link to="/perfil" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent">
                <ArrowLeft size={18} /> Voltar ao perfil
              </Link>
              <Link to="/lojista" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent">
                <Settings size={18} /> Configurações da loja
              </Link>
              <div className="mt-2 rounded-lg bg-muted/40 px-3 py-2 text-[10px] text-muted-foreground">
                <Radio size={12} className="mr-1 inline" /> Lives em breve
              </div>
            </nav>
          </SheetContent>
        </Sheet>
        <div className="flex-1 min-w-0">
          <p className="truncate text-xs text-white/80">{store.name}</p>
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>
        {store.logo_url && (
          <img src={store.logo_url} alt="Logo" className="h-9 w-9 rounded-full border-2 border-white/50 object-cover" />
        )}
      </header>
      <div className="px-5 py-5">{children}</div>
    </AppShell>
  );
}