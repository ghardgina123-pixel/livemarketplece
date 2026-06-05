import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Settings, Package, Heart, MapPin, CreditCard, ShieldCheck, HelpCircle, LogOut, ChevronRight, BadgeCheck, Store as StoreIcon } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CurrencySelector } from "@/components/CurrencySelector";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil — Live Market" },
      { property: "og:url", content: "https://livemarket.app/perfil" },
    ],
    links: [{ rel: "canonical", href: "https://livemarket.app/perfil" }],
  }),
  component: Perfil,
});

const menu = [
  { icon: Package, label: "Meus pedidos", badge: "3" },
  { icon: Heart, label: "Favoritos" },
  { icon: CreditCard, label: "Pagamentos" },
  { icon: ShieldCheck, label: "Segurança e privacidade" },
  { icon: HelpCircle, label: "Ajuda e suporte" },
];

function Perfil() {
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  const displayName = (user?.user_metadata?.display_name as string) || user?.email?.split("@")[0] || "Convidado";
  const initials = displayName.slice(0, 2).toUpperCase();
  const handleLogout = async () => {
    await signOut();
    nav({ to: "/login", replace: true });
  };
  return (
    <AppShell>
      <header className="px-5 pt-6 pb-6 text-white" style={{ background: "var(--gradient-brand)" }}>
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Perfil</h1>
          <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur"><Settings size={18} /></button>
        </div>
        <div className="mt-5 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-2xl font-bold text-secondary">{initials}</div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-lg font-bold">{displayName}</p>
              <BadgeCheck size={16} />
            </div>
            <p className="text-xs text-white/80">{user?.email ?? "Faça login para continuar"}</p>
            <span className="mt-1 inline-block rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold">Cliente Gold</span>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-white/15 p-3 text-center backdrop-blur">
          <Stat n="12" l="Pedidos" />
          <Stat n="48" l="Favoritos" />
          <Stat n="9" l="Seguindo" />
        </div>
      </header>

      <ul className="divide-y divide-border px-2">
        {user && (
          <li>
            <Link to="/lojista" className="flex w-full items-center gap-3 px-3 py-4 text-left">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl text-white" style={{ background: "var(--gradient-brand)" }}><StoreIcon size={18} /></div>
              <span className="flex-1 text-sm font-semibold text-foreground">Quero vender / Minha loja</span>
              <ChevronRight size={16} className="text-muted-foreground" />
            </Link>
          </li>
        )}
        {user && (
          <li>
            <Link to="/enderecos" className="flex w-full items-center gap-3 px-3 py-4 text-left">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground"><MapPin size={18} /></div>
              <span className="flex-1 text-sm font-medium text-foreground">Meus endereços</span>
              <ChevronRight size={16} className="text-muted-foreground" />
            </Link>
          </li>
        )}
        {menu.map(({ icon: Icon, label, badge }) => (
          <li key={label}>
            <button className="flex w-full items-center gap-3 px-3 py-4 text-left">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground"><Icon size={18} /></div>
              <span className="flex-1 text-sm font-medium text-foreground">{label}</span>
              {badge && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">{badge}</span>}
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>
          </li>
        ))}
      </ul>

      <div className="px-5 pt-4">
        <h3 className="mb-2 text-xs font-bold uppercase text-muted-foreground">Região e moeda</h3>
        <CurrencySelector variant="row" />
      </div>

      <div className="px-5 pt-3">
        {user ? (
          <button onClick={handleLogout} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border text-sm font-semibold text-destructive">
            <LogOut size={16} /> Sair da conta
          </button>
        ) : (
          <Link to="/login" className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border text-sm font-semibold text-primary">
            Entrar
          </Link>
        )}
        <p className="mt-4 text-center text-[10px] text-muted-foreground">Live Market v1.0 · Feito com 💚</p>
      </div>
    </AppShell>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <p className="text-lg font-bold">{n}</p>
      <p className="text-[10px] text-white/80">{l}</p>
    </div>
  );
}