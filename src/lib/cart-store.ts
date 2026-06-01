import { useSyncExternalStore } from "react";
import type { Product } from "./data";

export type CartItem = { product: Product; qty: number };

let cart: CartItem[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const cartStore = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  getSnapshot() {
    return cart;
  },
  add(product: Product, qty = 1) {
    const existing = cart.find((i) => i.product.id === product.id);
    if (existing) {
      cart = cart.map((i) => (i.product.id === product.id ? { ...i, qty: i.qty + qty } : i));
    } else {
      cart = [...cart, { product, qty }];
    }
    emit();
  },
  remove(id: string) {
    cart = cart.filter((i) => i.product.id !== id);
    emit();
  },
  setQty(id: string, qty: number) {
    if (qty <= 0) return cartStore.remove(id);
    cart = cart.map((i) => (i.product.id === id ? { ...i, qty } : i));
    emit();
  },
  clear() {
    cart = [];
    emit();
  },
};

export function useCart() {
  return useSyncExternalStore(cartStore.subscribe, cartStore.getSnapshot, cartStore.getSnapshot);
}

export function useCartCount() {
  const items = useCart();
  return items.reduce((s, i) => s + i.qty, 0);
}

export function useCartTotal() {
  const items = useCart();
  return items.reduce((s, i) => s + i.qty * i.product.price, 0);
}