import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail, Lock, Radio, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — Live Market" },
      { property: "og:url", content: "https://livemarket.app/login" },
    ],
    links: [{ rel: "canonical", href: "https://livemarket.app/login" }],
  }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) nav({ to: "/home", replace: true });
  }, [user, nav]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pwd });
    setBusy(false);
    if (error) {
      toast.error(error.message === "Invalid login credentials" ? "E-mail ou senha incorretos" : error.message);
      return;
    }
    nav({ to: "/home", replace: true });
  };

  const onGoogle = async () => {
    setBusy(true);
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/home" });
    if (res.error) {
      setBusy(false);
      toast.error("Falha ao entrar com Google");
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-background">
      <div
        className="flex h-56 flex-col items-center justify-center text-white"
        style={{ background: "var(--gradient-brand)" }}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md ring-1 ring-white/30">
          <Radio size={28} />
        </div>
        <h1 className="mt-3 text-2xl font-bold">Live Market</h1>
        <p className="text-xs text-white/80">Compre, Converse e Receba.</p>
      </div>
      <form onSubmit={onSubmit} className="-mt-6 flex-1 rounded-t-3xl bg-background px-6 pt-8">
        <h2 className="text-2xl font-bold text-foreground">Entrar</h2>
        <p className="mt-1 text-sm text-muted-foreground">Acesse sua conta para comprar ao vivo</p>

        <div className="mt-6 space-y-4">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input type="email" required className="h-12 pl-10" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input type="password" required minLength={6} className="h-12 pl-10" placeholder="Senha" value={pwd} onChange={(e) => setPwd(e.target.value)} />
          </div>
          <div className="flex justify-end">
            <button type="button" className="text-xs font-medium text-primary">Esqueci minha senha</button>
          </div>
        </div>

        <Button type="submit" disabled={busy} className="mt-6 h-12 w-full rounded-xl text-base font-semibold shadow-[var(--shadow-glow)]">
          {busy ? <Loader2 className="animate-spin" size={18} /> : "Entrar"}
        </Button>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />ou continue com<div className="h-px flex-1 bg-border" />
        </div>
        <Button variant="outline" type="button" onClick={onGoogle} disabled={busy} className="h-11 w-full rounded-xl">
          Continuar com Google
        </Button>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Novo por aqui?{" "}
          <Link to="/cadastro" className="font-semibold text-primary">Criar conta</Link>
        </p>
      </form>
    </div>
  );
}