import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Send, ShieldCheck, ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { stores } from "@/lib/data";

export const Route = createFileRoute("/chat")({
  head: () => ({ meta: [{ title: "Chat — Live Market" }] }),
  component: ChatPage,
});

type Msg = { from: "me" | "them"; text: string; time: string };

function ChatPage() {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = openId ? stores.find((s) => s.id === openId) : null;
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: "them", text: "Olá! Como posso te ajudar hoje? 👋", time: "09:12" },
    { from: "me", text: "Oi! O abacate ainda está disponível?", time: "09:13" },
    { from: "them", text: "Sim! Acabou de chegar lote fresquinho 🥑", time: "09:13" },
  ]);
  const [input, setInput] = useState("");

  if (open) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-background">
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background px-4 py-3">
          <button onClick={() => setOpenId(null)}><ArrowLeft size={20} /></button>
          <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${open.cover} text-xl`}>{open.emoji}</div>
          <div className="flex-1">
            <p className="text-sm font-semibold">{open.name}</p>
            <p className="text-[11px] text-primary">● online agora</p>
          </div>
        </header>
        <div className="flex-1 space-y-3 px-4 py-4">
          <div className="mx-auto flex max-w-[80%] items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-[11px] text-accent-foreground">
            <ShieldCheck size={12} /> Conversa protegida pelo Live Market
          </div>
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.from === "me" ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-muted text-foreground"}`}>
                <p>{m.text}</p>
                <p className={`mt-0.5 text-[10px] ${m.from === "me" ? "text-white/70" : "text-muted-foreground"}`}>{m.time}</p>
              </div>
            </div>
          ))}
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); if (!input.trim()) return; setMsgs((m) => [...m, { from: "me", text: input, time: "agora" }]); setInput(""); }}
          className="sticky bottom-0 flex items-center gap-2 border-t border-border bg-background p-3"
        >
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Mensagem…" className="h-11 flex-1 rounded-full bg-muted" />
          <button type="submit" className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-glow)]"><Send size={18} /></button>
        </form>
      </div>
    );
  }

  return (
    <AppShell>
      <header className="px-5 pt-6 pb-3">
        <h1 className="text-2xl font-bold">Mensagens</h1>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input placeholder="Buscar conversas…" className="h-11 rounded-xl bg-muted pl-10" />
        </div>
      </header>
      <ul className="divide-y divide-border">
        {stores.map((s, i) => (
          <li key={s.id}>
            <button onClick={() => setOpenId(s.id)} className="flex w-full items-center gap-3 px-5 py-3 text-left">
              <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${s.cover} text-xl`}>{s.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="truncate font-semibold">{s.name}</p>
                  <span className="text-[10px] text-muted-foreground">{i === 0 ? "agora" : `${i * 2}h`}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="truncate text-xs text-muted-foreground">{i % 2 === 0 ? "Obrigada pela compra! 💚" : "Acabou de chegar estoque novo"}</p>
                  {i < 2 && <span className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">{i + 1}</span>}
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}