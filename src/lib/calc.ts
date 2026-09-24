import type { CartItem } from "./types";

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function lineTotal(item: Pick<CartItem, "price" | "quantity" | "discount">): number {
  return round2(Math.max(item.price * item.quantity - item.discount, 0));
}

export interface CartTotals { subtotal: number; itemDiscount: number; orderDiscount: number; discount: number; total: number; cost: number; profit: number; items: number }

export function cartTotals(items: CartItem[], orderDiscount = 0): CartTotals {
  const subtotal = round2(items.reduce((s, i) => s + i.price * i.quantity, 0));
  const itemDiscount = round2(items.reduce((s, i) => s + Math.min(i.discount, i.price * i.quantity), 0));
  const afterItems = round2(subtotal - itemDiscount);
  const od = round2(Math.min(Math.max(orderDiscount, 0), afterItems));
  const total = round2(afterItems - od);
  const cost = round2(items.reduce((s, i) => s + i.costPrice * i.quantity, 0));
  return { subtotal, itemDiscount, orderDiscount: od, discount: round2(itemDiscount + od), total, cost, profit: round2(total - cost), items: items.reduce((s, i) => s + i.quantity, 0) };
}

export function changeDue(total: number, paid: number): number {
  return round2(Math.max(paid - total, 0));
}

/** Revenue / cost / gross profit for a single line. */
export function lineProfit(costPrice: number, sellingPrice: number, quantity: number, discount = 0) {
  const revenue = round2(sellingPrice * quantity - discount);
  const cost = round2(costPrice * quantity);
  return { revenue, cost, grossProfit: round2(revenue - cost) };
}

/** Daily net profit = gross profit − expenses − return adjustments. */
export function netProfit(grossProfit: number, expenses: number, returnAdjustment: number): number {
  return round2(grossProfit - expenses - returnAdjustment);
}

/** Refund for returning qty units of a sale line (proportional to the net line total). */
export function refundFor(netTotal: number, soldQty: number, alreadyReturned: number, qty: number): number {
  if (soldQty <= 0) return 0;
  if (alreadyReturned + qty >= soldQty) return round2(netTotal - round2((netTotal / soldQty) * alreadyReturned));
  return round2(round2((netTotal / soldQty) * (alreadyReturned + qty)) - round2((netTotal / soldQty) * alreadyReturned));
}
