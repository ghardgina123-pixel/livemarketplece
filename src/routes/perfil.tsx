import { createFileRoute, Link } from "@tanstack/react-router";
import { Settings, Package, Heart, MapPin, CreditCard, ShieldCheck, HelpCircle, LogOut, ChevronRight, BadgeCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/perfil")({
  head: () => ({ meta: [{ title: "Perfil — Live Market" }] }),
  component: Perfil,
});

const menu = [
  { icon: Package, label: "Meus pedidos", badge: "3" },
  { icon: Heart, label: "Favoritos" },
  { icon: MapPin, label: "Endereços" },
  { icon: CreditCard, label: "Pagamentos" },
  { icon: ShieldCheck, label: "Segurança e privacidade" },
  { icon: HelpCircle, label: "Ajuda e suporte" },
];

function Perfil() {
  return (
    <AppShell>
      <header className="px-5 pt-6 pb-6 text-white" style={{ background: "var(--gradient-brand)" }}>
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Perfil</h1>
          <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur"><Settings size={18} /></button>
        </div>
        <div className="mt-5 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-2xl font-bold text-secondary">AM</div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-lg font-bold">Ana Mendes</p>
              <BadgeCheck size={16} />
            </div>
            <p className="text-xs text-white/80">ana.mendes@email.com</p>
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

      <div className="px-5 pt-3">
        <Link to="/login" className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border text-sm font-semibold text-destructive">
          <LogOut size={16} /> Sair da conta
        </Link>
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