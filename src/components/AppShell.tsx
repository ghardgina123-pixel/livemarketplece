import { Link, useLocation } from "@tanstack/react-router";
import { Home, Store, MessageCircle, ShoppingCart, User } from "lucide-react";
import { useCartCount } from "@/lib/cart-store";
import type { ReactNode } from "react";

const tabs = [
  { to: "/home", icon: Home, label: "Início" },
  { to: "/lojas", icon: Store, label: "Lojas" },
  { to: "/chat", icon: MessageCircle, label: "Chat" },
  { to: "/carrinho", icon: ShoppingCart, label: "Carrinho" },
  { to: "/perfil", icon: User, label: "Perfil" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const count = useCartCount();
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-background pb-20">
      {children}
      <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 border-t border-border bg-background/95 backdrop-blur-xl">
        <ul className="grid grid-cols-5">
          {tabs.map(({ to, icon: Icon, label }) => {
            const active = pathname === to || (to !== "/home" && pathname.startsWith(to));
            return (
              <li key={to}>
                <Link to={to} className="relative flex flex-col items-center gap-1 py-3 text-[11px]">
                  <div className={active ? "text-primary" : "text-muted-foreground"}>
                    <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
                    {to === "/carrinho" && count > 0 && (
                      <span className="absolute right-[calc(50%-22px)] top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--live)] px-1 text-[9px] font-bold text-white">
                        {count}
                      </span>
                    )}
                  </div>
                  <span className={active ? "font-semibold text-primary" : "text-muted-foreground"}>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export function StoreCover({ gradient, emoji, className = "" }: { gradient: string; emoji: string; className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-gradient-to-br ${gradient} ${className}`}>
      <span className="text-5xl drop-shadow-lg">{emoji}</span>
    </div>
  );
}