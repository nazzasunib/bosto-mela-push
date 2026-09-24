"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cartTotals } from "@/lib/calc";
import type { CartItem, PaymentMethod, Product } from "@/lib/types";

const KEY = "bm.pos.draft.v1";

interface Draft { ref: string; items: CartItem[]; orderDiscount: number; method: PaymentMethod; paid: string; phone: string }
const newRef = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);
const empty = (): Draft => ({ ref: newRef(), items: [], orderDiscount: 0, method: "cash", paid: "", phone: "" });

export const toCartItem = (p: Product, quantity: number): CartItem => ({
  productId: p.id, name: p.name, code: p.code, size: p.size, color: p.color, costPrice: p.cost_price, price: p.selling_price,
  quantity, discount: 0, stock: p.stock_quantity, imageUrl: p.image_url,
});

export type AddResult = { status: "added" | "capped" | "out"; quantity: number };

function restore(products: Product[]): Draft {
  try {
    const raw = typeof window === "undefined" ? null : localStorage.getItem(KEY);
    if (!raw) return empty();
    const saved = JSON.parse(raw) as Draft;
    const byId = new Map(products.map((p) => [p.id, p]));
    const items = (saved.items ?? []).flatMap((i) => {
      const p = byId.get(i.productId);
      return p ? [{ ...i, name: p.name, price: p.selling_price, costPrice: p.cost_price, quantity: Math.max(1, Math.min(i.quantity, p.stock_quantity || i.quantity)) }] : [];
    });
    return { ...empty(), ...saved, items, ref: saved.ref || newRef() };
  } catch {
    return empty();
  }
}

/**
 * POS cart state. The draft is kept in localStorage so a refresh never loses the current customer's cart.
 * Must render client-side only (see pos-screen-loader) because the initial state is read from storage.
 */
export function useCart(products: Product[]) {
  const [draft, setDraft] = useState<Draft>(() => restore(products));

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(draft)); } catch { /* storage full or blocked */ }
  }, [draft]);

  // stock always comes from the latest product data
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const items = useMemo(() => draft.items.map((i) => { const p = byId.get(i.productId); return p ? { ...i, stock: p.stock_quantity } : i; }), [draft.items, byId]);

  const add = useCallback((p: Product, qty: number): AddResult => {
    const inCart = items.find((i) => i.productId === p.id)?.quantity ?? 0;
    const room = Math.max(p.stock_quantity - inCart, 0);
    if (room <= 0) return { status: "out", quantity: 0 };
    const addQty = Math.min(qty, room);
    setDraft((d) => {
      const exists = d.items.some((i) => i.productId === p.id);
      const items = exists ? d.items.map((i) => (i.productId === p.id ? { ...i, quantity: i.quantity + addQty, stock: p.stock_quantity } : i)) : [toCartItem(p, addQty), ...d.items];
      return { ...d, items };
    });
    return { status: addQty < qty ? "capped" : "added", quantity: addQty };
  }, [items]);

  const setQty = useCallback((id: string, qty: number) => {
    const max = Math.max(byId.get(id)?.stock_quantity ?? 1, 1);
    setDraft((d) => ({ ...d, items: d.items.map((i) => (i.productId === id ? { ...i, quantity: Math.max(1, Math.min(Math.trunc(qty) || 1, max)) } : i)) }));
  }, [byId]);
  const setDiscount = useCallback((id: string, disc: number) => setDraft((d) => ({ ...d, items: d.items.map((i) => (i.productId === id ? { ...i, discount: Math.max(0, Math.min(disc || 0, i.price * i.quantity)) } : i)) })), []);
  const remove = useCallback((id: string) => setDraft((d) => ({ ...d, items: d.items.filter((i) => i.productId !== id) })), []);
  const clear = useCallback(() => setDraft(empty()), []);
  const patch = useCallback((p: Partial<Omit<Draft, "items" | "ref">>) => setDraft((d) => ({ ...d, ...p })), []);

  const totals = useMemo(() => cartTotals(items, draft.orderDiscount), [items, draft.orderDiscount]);
  return { ...draft, items, totals, add, setQty, setDiscount, remove, clear, patch };
}

export type Cart = ReturnType<typeof useCart>;
