import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { CURRENCIES, currencyStore, useCurrency, type CurrencyCode } from "@/lib/currency";

export function CurrencySelector({ variant = "pill" }: { variant?: "pill" | "row" }) {
  const current = useCurrency();
  const [open, setOpen] = useState(false);

  const trigger =
    variant === "pill" ? (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-md"
      >
        <span className="text-sm leading-none">{current.flag}</span>
        {current.code}
        <ChevronDown size={12} />
      </button>
    ) : (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-2xl border border-border bg-card p-3 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{current.flag}</span>
          <div>
            <p className="text-sm font-semibold">Moeda</p>
            <p className="text-xs text-muted-foreground">{current.name} ({current.code})</p>
          </div>
        </div>
        <ChevronDown size={16} className="text-muted-foreground" />
      </button>
    );

  return (
    <>
      {trigger}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
          onClick={() => setOpen(false)}
        >
          <div
            className="mx-auto w-full max-w-[480px] rounded-t-3xl bg-background p-5 pb-8 text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted" />
            <h3 className="text-base font-bold">Selecione sua moeda</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Os preços serão convertidos automaticamente.
            </p>
            <ul className="mt-4 space-y-2">
              {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => {
                const c = CURRENCIES[code];
                const active = code === current.code;
                return (
                  <li key={code}>
                    <button
                      onClick={() => { currencyStore.set(code); setOpen(false); }}
                      className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${active ? "border-primary bg-accent" : "border-border"}`}
                    >
                      <span className="text-2xl">{c.flag}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.code} · {c.symbol}</p>
                      </div>
                      {active && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check size={14} strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}