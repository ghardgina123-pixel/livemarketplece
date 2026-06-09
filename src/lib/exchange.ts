import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CURRENCIES, type CurrencyCode } from "@/lib/currency";

// AOA-based conversion utility. All product prices are stored in AOA
// (`products.price_aoa`). At render time we convert into the user's selected
// currency using rates from the `exchange_rates` table.

export type RateMap = Partial<Record<CurrencyCode, number>>;

let cache: { at: number; rates: RateMap } | null = null;
const TTL_MS = 5 * 60 * 1000; // 5 minutes
const listeners = new Set<(r: RateMap) => void>();

async function fetchRates(): Promise<RateMap> {
  const { data, error } = await supabase
    .from("exchange_rates")
    .select("from_currency, to_currency, rate")
    .eq("from_currency", "AOA");
  if (error) throw error;
  const map: RateMap = { AOA: 1 };
  for (const row of data ?? []) {
    map[row.to_currency as CurrencyCode] = Number(row.rate);
  }
  return map;
}

export async function getRates(force = false): Promise<RateMap> {
  if (!force && cache && Date.now() - cache.at < TTL_MS) return cache.rates;
  const rates = await fetchRates();
  cache = { at: Date.now(), rates };
  listeners.forEach((l) => l(rates));
  return rates;
}

/**
 * Convert a price stored in AOA to the target currency.
 * Falls back to the static rate in CURRENCIES when no DB rate is loaded yet.
 */
export function convertFromAOA(priceAoa: number, target: CurrencyCode, rates?: RateMap): number {
  if (target === "AOA") return priceAoa;
  const dbRate = rates?.[target];
  if (typeof dbRate === "number" && dbRate > 0) return priceAoa * dbRate;
  // Fallback: derive from the static BRL-based table (BRL is base in CURRENCIES).
  const aoaPerBrl = CURRENCIES.AOA.rate;
  const targetPerBrl = CURRENCIES[target].rate;
  if (!aoaPerBrl || !targetPerBrl) return priceAoa;
  return (priceAoa / aoaPerBrl) * targetPerBrl;
}

/** Format a number in the given currency without re-converting. */
export function formatInCurrency(value: number, target: CurrencyCode): string {
  const c = CURRENCIES[target];
  if (target === "AOA") {
    const n = Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return `${n} AOA`;
  }
  try {
    return new Intl.NumberFormat(c.locale, {
      style: "currency",
      currency: c.code,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${c.symbol} ${value.toFixed(2)}`;
  }
}

/** One-shot convert + format helper for components. */
export function formatPriceAoa(priceAoa: number, target: CurrencyCode, rates?: RateMap): string {
  return formatInCurrency(convertFromAOA(priceAoa, target, rates), target);
}

/** React hook: returns live exchange rates (AOA -> *). Refreshes on mount. */
export function useExchangeRates(): RateMap {
  const [rates, setRates] = useState<RateMap>(() => cache?.rates ?? { AOA: 1 });
  useEffect(() => {
    let alive = true;
    getRates().then((r) => { if (alive) setRates(r); }).catch(() => {});
    const l = (r: RateMap) => setRates(r);
    listeners.add(l);
    return () => { alive = false; listeners.delete(l); };
  }, []);
  return rates;
}