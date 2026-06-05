import { Banknote, CreditCard, Building2, Receipt } from "lucide-react";
import type { ReactNode } from "react";

export type PaymentBrand = {
  name: string;
  bg: string;     // background color (brand)
  fg: string;     // foreground/text color on bg
  ring: string;   // subtle ring/tint for cards
  tint: string;   // light background tint
  logo: ReactNode; // square logo node (renders inside a 36-40px tile)
  tagline?: string;
};

// Stylized brand badges (no third-party trademarks copied verbatim).
// Colors approximate each provider's identity.
const Mono = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <span className={`text-[11px] font-extrabold leading-none tracking-tight ${className}`}>{children}</span>
);

export const PAYMENT_BRANDS: Record<string, PaymentBrand> = {
  multicaixa_express: {
    name: "Multicaixa Express",
    bg: "#E2231A", fg: "#FFFFFF",
    ring: "rgba(226,35,26,0.25)", tint: "#FEECEB",
    logo: <Mono className="text-white">EXP</Mono>,
    tagline: "Pagamento instantâneo",
  },
  multicaixa_reference: {
    name: "Referência Multicaixa",
    bg: "#003DA5", fg: "#FFFFFF",
    ring: "rgba(0,61,165,0.25)", tint: "#E6EEFB",
    logo: <Mono className="text-white">MC</Mono>,
    tagline: "Pagar por referência",
  },
  ekwanza: {
    name: "e-Kwanza",
    bg: "#00A859", fg: "#FFFFFF",
    ring: "rgba(0,168,89,0.25)", tint: "#E6F6EE",
    logo: <Mono className="text-white">eK</Mono>,
    tagline: "Carteira digital BAI",
  },
  unitel_money: {
    name: "Unitel Money",
    bg: "#E30613", fg: "#FFFFFF",
    ring: "rgba(227,6,19,0.25)", tint: "#FDE7E9",
    logo: <Mono className="text-white">UM</Mono>,
    tagline: "Dinheiro móvel Unitel",
  },
  afrimoney: {
    name: "Afrimoney",
    bg: "#F58220", fg: "#FFFFFF",
    ring: "rgba(245,130,32,0.25)", tint: "#FEEFE1",
    logo: <Mono className="text-white">AM</Mono>,
    tagline: "Dinheiro móvel Africell",
  },
  kwik: {
    name: "Kwik",
    bg: "#FFD200", fg: "#111111",
    ring: "rgba(255,210,0,0.4)", tint: "#FFF8D6",
    logo: <Mono className="text-black">Kw</Mono>,
    tagline: "Pagamento rápido",
  },
  stripe_card: {
    name: "Cartão (Visa / Mastercard)",
    bg: "#635BFF", fg: "#FFFFFF",
    ring: "rgba(99,91,255,0.25)", tint: "#ECEBFF",
    logo: <CreditCard size={18} className="text-white" />,
    tagline: "Crédito ou débito",
  },
  bank_transfer: {
    name: "Transferência Bancária",
    bg: "#0F172A", fg: "#FFFFFF",
    ring: "rgba(15,23,42,0.2)", tint: "#E2E8F0",
    logo: <Building2 size={18} className="text-white" />,
    tagline: "IBAN / depósito",
  },
  cash_on_delivery: {
    name: "Dinheiro na entrega",
    bg: "#16A34A", fg: "#FFFFFF",
    ring: "rgba(22,163,74,0.25)", tint: "#E7F7EE",
    logo: <Banknote size={18} className="text-white" />,
    tagline: "Pagar ao receber",
  },
};

export const FALLBACK_BRAND: PaymentBrand = {
  name: "Pagamento",
  bg: "#64748B", fg: "#FFFFFF",
  ring: "rgba(100,116,139,0.25)", tint: "#F1F5F9",
  logo: <Receipt size={18} className="text-white" />,
};

export function getBrand(methodType?: string | null): PaymentBrand {
  if (!methodType) return FALLBACK_BRAND;
  return PAYMENT_BRANDS[methodType] ?? FALLBACK_BRAND;
}

export function BrandLogo({
  methodType,
  size = 40,
  rounded = "rounded-xl",
}: { methodType?: string | null; size?: number; rounded?: string }) {
  const b = getBrand(methodType);
  return (
    <div
      className={`flex shrink-0 items-center justify-center ${rounded} shadow-sm`}
      style={{ width: size, height: size, background: b.bg, color: b.fg, boxShadow: `0 1px 0 ${b.ring}` }}
      aria-label={b.name}
    >
      {b.logo}
    </div>
  );
}