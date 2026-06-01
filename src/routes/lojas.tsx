import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Star, Radio, BadgeCheck } from "lucide-react";
import { AppShell, StoreCover } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { stores } from "@/lib/data";
import { useState } from "react";

export const Route = createFileRoute("/lojas")({
  head: () => ({ meta: [{ title: "Lojas — Live Market" }] }),
  component: Lojas,
});

function Lojas() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "live">("all");
  const list = stores.filter((s) =>
    (filter === "all" || s.live) &&
    (s.name.toLowerCase().includes(q.toLowerCase()) || s.category.toLowerCase().includes(q.toLowerCase()))
  );
  return (
    <AppShell>
      <header className="sticky top-0 z-30 bg-background/95 px-5 pt-6 pb-3 backdrop-blur-xl">
        <h1 className="text-2xl font-bold">Lojas</h1>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar lojas e categorias…" className="h-11 rounded-xl bg-muted pl-10" />
        </div>
        <div className="mt-3 flex gap-2">
          {(["all", "live"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${filter === f ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"}`}>
              {f === "all" ? "Todas" : "🔴 Ao vivo"}
            </button>
          ))}
        </div>
      </header>

      <ul className="space-y-3 px-5 pt-2">
        {list.map((s) => (
          <li key={s.id}>
            <Link to="/loja/$id" params={{ id: s.id }} className="flex gap-3 rounded-2xl bg-card p-3 shadow-[var(--shadow-soft)]">
              <StoreCover gradient={s.cover} emoji={s.emoji} className="h-20 w-20 shrink-0 rounded-xl" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="truncate font-semibold">{s.name}</p>
                  <BadgeCheck size={14} className="shrink-0 text-primary" />
                  {s.live && (
                    <span className="ml-auto flex items-center gap-1 rounded-md bg-[var(--live)] px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                      <Radio size={9} /> live
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{s.tagline}</p>
                <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Star size={11} className="fill-yellow-400 text-yellow-400" />{s.rating}</span>
                  <span>{s.followers} seguidores</span>
                  <span className="rounded-full bg-accent px-2 py-0.5 text-accent-foreground">{s.category}</span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}