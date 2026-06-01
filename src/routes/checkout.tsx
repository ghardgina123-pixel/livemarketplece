import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, MapPin, CreditCard, Banknote, Smartphone, ShieldCheck, Check } from "lucide-react";
import { useState } from "react";
import { cartStore, useCart, useCartTotal } from "@/lib/cart-store";
import { formatPrice, useCurrency } from "@/lib/currency";
import { CurrencySelector } from "@/components/CurrencySelector";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Live Market" }] }),
  component: Checkout,
});

function Checkout() {
  const nav = useNavigate();
  const items = useCart();
  const total = useCartTotal();
  const currency = useCurrency();
  const [pay, setPay] = useState<"pix" | "card" | "boleto">("pix");
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col items-center justify-center bg-background px-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-glow)]">
          <Check size={40} strokeWidth={3} />
        </div>
        <h1 className="mt-5 text-2xl font-bold">Pedido confirmado!</h1>
        <p className="mt-2 text-sm text-muted-foreground">Você receberá atualizações pelo chat e e-mail. Obrigado por comprar conosco 💚</p>
        <button onClick={() => nav({ to: "/home" })} className="mt-8 h-12 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]">
          Voltar para o início
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-[480px] bg-background pb-32">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background px-5 py-4">
        <button onClick={() => history.back()}><ArrowLeft size={20} /></button>
        <h1 className="flex-1 text-lg font-bold">Finalizar compra</h1>
        <div className="rounded-full bg-muted px-2 py-1 text-xs font-semibold">
          {currency.flag} {currency.code}
        </div>
      </header>

      <section className="px-5 pt-5">
        <h2 className="text-xs font-bold uppercase text-muted-foreground">Entregar em</h2>
        <div className="mt-2 flex items-start gap-3 rounded-2xl border border-border p-3">
          <MapPin size={20} className="mt-0.5 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Casa · Rua das Flores, 123</p>
            <p className="text-xs text-muted-foreground">São Paulo, SP · 01234-567</p>
          </div>
          <button className="text-xs font-semibold text-primary">Alterar</button>
        </div>
      </section>

      <section className="px-5 pt-5">
        <h2 className="text-xs font-bold uppercase text-muted-foreground">Itens ({items.length})</h2>
        <ul className="mt-2 space-y-2">
          {items.map(({ product: p, qty }) => (
            <li key={p.id} className="flex items-center gap-3 rounded-xl bg-muted p-2.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-card text-2xl">{p.emoji}</div>
              <div className="flex-1 min-w-0">
                <p className="line-clamp-1 text-sm font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">Qtd {qty}</p>
              </div>
              <span className="text-sm font-bold">{formatPrice(p.price * qty, currency)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="px-5 pt-5">
        <h2 className="text-xs font-bold uppercase text-muted-foreground">Forma de pagamento</h2>
        <div className="mt-2">
          <CurrencySelector variant="row" />
        </div>
        <div className="mt-2 space-y-2">
          {currency.code === "BRL" && <>
            <PayOption active={pay === "pix"} onClick={() => setPay("pix")} icon={<Smartphone size={20} />} label="Pix" desc="Aprovação imediata · 5% off" />
            <PayOption active={pay === "card"} onClick={() => setPay("card")} icon={<CreditCard size={20} />} label="Cartão de crédito" desc="Até 12x sem juros" />
            <PayOption active={pay === "boleto"} onClick={() => setPay("boleto")} icon={<Banknote size={20} />} label="Boleto" desc="Aprovação em até 2 dias" />
          </>}
          {currency.code === "AOA" && <>
            <PayOption active={pay === "pix"} onClick={() => setPay("pix")} icon={<Smartphone size={20} />} label="Multicaixa Express" desc="Pagamento instantâneo · 5% off" />
            <PayOption active={pay === "card"} onClick={() => setPay("card")} icon={<CreditCard size={20} />} label="Cartão Multicaixa / Visa" desc="Débito ou crédito" />
            <PayOption active={pay === "boleto"} onClick={() => setPay("boleto")} icon={<Banknote size={20} />} label="Transferência bancária" desc="BAI · BFA · BIC · Atlântico" />
          </>}
          {currency.code === "USD" && <>
            <PayOption active={pay === "pix"} onClick={() => setPay("pix")} icon={<Smartphone size={20} />} label="Apple Pay / Google Pay" desc="Pagamento em 1 toque · 5% off" />
            <PayOption active={pay === "card"} onClick={() => setPay("card")} icon={<CreditCard size={20} />} label="Credit / Debit card" desc="Visa · Mastercard · Amex" />
            <PayOption active={pay === "boleto"} onClick={() => setPay("boleto")} icon={<Banknote size={20} />} label="Bank transfer (ACH)" desc="Approval in 1–2 business days" />
          </>}
          {currency.code === "EUR" && <>
            <PayOption active={pay === "pix"} onClick={() => setPay("pix")} icon={<Smartphone size={20} />} label="Apple Pay / Google Pay" desc="Pagamento instantâneo · 5% off" />
            <PayOption active={pay === "card"} onClick={() => setPay("card")} icon={<CreditCard size={20} />} label="Cartão de crédito / débito" desc="Visa · Mastercard" />
            <PayOption active={pay === "boleto"} onClick={() => setPay("boleto")} icon={<Banknote size={20} />} label="SEPA · Transferência bancária" desc="Aprovação em 1–2 dias" />
          </>}
        </div>
      </section>

      <section className="mx-5 mt-5 rounded-2xl bg-muted p-4 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(total, currency)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Frete</span><span className="text-primary">Grátis</span></div>
        {pay === "pix" && <div className="flex justify-between"><span className="text-muted-foreground">Desconto à vista</span><span className="text-primary">- {formatPrice(total * 0.05, currency)}</span></div>}
        <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-bold">
          <span>Total</span><span>{formatPrice(pay === "pix" ? total * 0.95 : total, currency)}</span>
        </div>
      </section>

      <div className="mx-5 mt-3 flex items-center gap-2 rounded-xl bg-accent p-3 text-[11px] text-accent-foreground">
        <ShieldCheck size={14} /> Garantia Live Market: reembolso total se algo der errado
      </div>

      <div className="fixed bottom-0 left-1/2 w-full max-w-[480px] -translate-x-1/2 border-t border-border bg-background p-3">
        <button
          onClick={() => { setDone(true); cartStore.clear(); toast.success("Pedido realizado!"); }}
          className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
        >
          Pagar {formatPrice(pay === "pix" ? total * 0.95 : total, currency)}
        </button>
      </div>
    </div>
  );
}

function PayOption({ active, onClick, icon, label, desc }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; desc: string }) {
  return (
    <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${active ? "border-primary bg-accent" : "border-border"}`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>{icon}</div>
      <div className="flex-1">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-[11px] text-muted-foreground">{desc}</p>
      </div>
      <div className={`h-5 w-5 rounded-full border-2 ${active ? "border-primary bg-primary" : "border-border"}`}>
        {active && <Check size={14} className="m-auto text-primary-foreground" strokeWidth={3} />}
      </div>
    </button>
  );
}