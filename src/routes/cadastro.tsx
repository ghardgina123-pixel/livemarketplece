import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Lock, User as UserIcon, Phone, ShieldCheck, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/cadastro")({
  head: () => ({ meta: [{ title: "Criar conta — Live Market" }] }),
  component: Signup,
});

function Signup() {
  const nav = useNavigate();
  const [f, setF] = useState({ name: "", email: "", phone: "", pwd: "" });
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.pwd.length < 6) { toast.error("Senha deve ter pelo menos 6 caracteres"); return; }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: f.email.trim(),
      password: f.pwd,
      options: {
        emailRedirectTo: window.location.origin + "/home",
        data: { display_name: f.name, phone: f.phone },
      },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Conta criada! Verifique seu e-mail para confirmar.");
    nav({ to: "/login", replace: true });
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-background">
      <header className="flex items-center gap-3 px-5 pt-6 pb-3">
        <Link to="/login" className="text-2xl text-foreground">←</Link>
        <h1 className="text-lg font-semibold">Criar conta</h1>
      </header>
      <form onSubmit={onSubmit} className="flex-1 px-6">
        <p className="text-sm text-muted-foreground">É rápido e seguro. Sem complicação.</p>
        <div className="mt-6 space-y-4">
          <Field icon={<UserIcon size={18} />} placeholder="Nome completo" value={f.name} onChange={(v) => setF({ ...f, name: v })} required />
          <Field icon={<Mail size={18} />} placeholder="E-mail" type="email" value={f.email} onChange={(v) => setF({ ...f, email: v })} required />
          <Field icon={<Phone size={18} />} placeholder="Telefone" value={f.phone} onChange={(v) => setF({ ...f, phone: v })} />
          <Field icon={<Lock size={18} />} type="password" placeholder="Crie uma senha (mín. 6)" value={f.pwd} onChange={(v) => setF({ ...f, pwd: v })} required />
        </div>
        <div className="mt-5 flex items-start gap-2 rounded-xl bg-accent p-3 text-xs text-accent-foreground">
          <ShieldCheck size={16} className="mt-0.5 shrink-0" />
          Seus dados são protegidos. Não compartilhamos com terceiros.
        </div>
        <Button type="submit" disabled={busy} className="mt-6 h-12 w-full rounded-xl text-base font-semibold shadow-[var(--shadow-glow)]">
          {busy ? <Loader2 className="animate-spin" size={18} /> : "Criar conta"}
        </Button>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Já tem conta? <Link to="/login" className="font-semibold text-primary">Entrar</Link>
        </p>
      </form>
    </div>
  );
}

function Field({ icon, value, onChange, placeholder, type = "text", required }: { icon: React.ReactNode; value: string; onChange: (v: string) => void; placeholder: string; type?: string; required?: boolean }) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</div>
      <Input type={type} required={required} className="h-12 pl-10" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}