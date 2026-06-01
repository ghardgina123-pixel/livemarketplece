import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Lock, User as UserIcon, Phone, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/cadastro")({
  head: () => ({ meta: [{ title: "Criar conta — Live Market" }] }),
  component: Signup,
});

function Signup() {
  const nav = useNavigate();
  const [f, setF] = useState({ name: "", email: "", phone: "", pwd: "" });
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-background">
      <header className="flex items-center gap-3 px-5 pt-6 pb-3">
        <Link to="/login" className="text-2xl text-foreground">←</Link>
        <h1 className="text-lg font-semibold">Criar conta</h1>
      </header>
      <form onSubmit={(e) => { e.preventDefault(); nav({ to: "/home" }); }} className="flex-1 px-6">
        <p className="text-sm text-muted-foreground">É rápido e seguro. Sem complicação.</p>
        <div className="mt-6 space-y-4">
          <Field icon={<UserIcon size={18} />} placeholder="Nome completo" value={f.name} onChange={(v) => setF({ ...f, name: v })} />
          <Field icon={<Mail size={18} />} placeholder="E-mail" value={f.email} onChange={(v) => setF({ ...f, email: v })} />
          <Field icon={<Phone size={18} />} placeholder="Telefone" value={f.phone} onChange={(v) => setF({ ...f, phone: v })} />
          <Field icon={<Lock size={18} />} type="password" placeholder="Crie uma senha" value={f.pwd} onChange={(v) => setF({ ...f, pwd: v })} />
        </div>
        <div className="mt-5 flex items-start gap-2 rounded-xl bg-accent p-3 text-xs text-accent-foreground">
          <ShieldCheck size={16} className="mt-0.5 shrink-0" />
          Seus dados são protegidos. Não compartilhamos com terceiros.
        </div>
        <Button type="submit" className="mt-6 h-12 w-full rounded-xl text-base font-semibold shadow-[var(--shadow-glow)]">
          Criar conta
        </Button>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Já tem conta? <Link to="/login" className="font-semibold text-primary">Entrar</Link>
        </p>
      </form>
    </div>
  );
}

function Field({ icon, value, onChange, placeholder, type = "text" }: { icon: React.ReactNode; value: string; onChange: (v: string) => void; placeholder: string; type?: string }) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</div>
      <Input type={type} className="h-12 pl-10" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}