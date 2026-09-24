"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { lineTotal, round2 } from "@/lib/calc";
import { normalizeCode } from "@/lib/code-parser";
import { taka } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CartItem } from "@/lib/types";

interface Props {
  items: CartItem[]; lastAdded: string | null;
  onQty: (id: string, qty: number) => void; onSize: (id: string, size: string) => void; onCode: (id: string, code: string) => boolean; onPrice: (id: string, price: number) => void; onDiscount: (id: string, d: number) => void; onRemove: (id: string) => void;
}

function QtyControl({ item, onQty }: { item: CartItem; onQty: (id: string, q: number) => void }) {
  return (
    <div className="inline-flex items-center rounded-xl border bg-card shadow-xs">
      <button onClick={() => onQty(item.productId, item.quantity - 1)} disabled={item.quantity <= 1} className="grid size-9 cursor-pointer place-items-center rounded-l-xl text-navy transition hover:bg-accent disabled:opacity-30" aria-label="Decrease"><Minus className="size-3.5" /></button>
      <input type="number" min={1} max={item.stock} value={item.quantity} onChange={(e) => onQty(item.productId, Number(e.target.value))} onFocus={(e) => e.target.select()}
        className="h-9 w-12 border-x bg-transparent text-center text-sm font-bold tabular text-navy outline-none focus:bg-accent/40" aria-label="Quantity" />
      <button onClick={() => onQty(item.productId, item.quantity + 1)} disabled={item.quantity >= item.stock} className="grid size-9 cursor-pointer place-items-center rounded-r-xl text-navy transition hover:bg-accent disabled:opacity-30" aria-label="Increase"><Plus className="size-3.5" /></button>
    </div>
  );
}

/** Editable cost code: typing another code (e.g. BSSS) switches the line to that-priced product of the same category. */
function CodeInput({ item, onCode }: { item: CartItem; onCode: (id: string, code: string) => boolean }) {
  const [value, setValue] = useState(item.code);
  const [prev, setPrev] = useState(item.code);
  if (prev !== item.code) { setPrev(item.code); setValue(item.code); }
  const apply = () => { const c = normalizeCode(value); if (!c || c === normalizeCode(item.code) || !onCode(item.productId, c)) setValue(item.code); };
  return (
    <input value={value} onChange={(e) => setValue(normalizeCode(e.target.value))} onFocus={(e) => e.target.select()} onBlur={apply}
      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); } else if (e.key === "Escape") { setValue(item.code); } }}
      title="Type a cost code to pick the matching product of this category" aria-label={`Code for ${item.name}`}
      className="h-9 w-20 rounded-xl border border-dashed border-royal/30 bg-card px-2 font-mono text-xs font-bold text-royal uppercase outline-none focus:border-solid focus:border-blue focus:ring-2 focus:ring-blue/15" />
  );
}

const lineProfit = (i: CartItem) => round2(lineTotal(i) - i.costPrice * i.quantity);

function Profit({ item }: { item: CartItem }) {
  if (!item.price) return <span className="text-muted-foreground">—</span>;
  const p = lineProfit(item);
  return <span className={cn("font-semibold tabular", p < 0 ? "text-red-600" : "text-emerald-700")}>{p < 0 ? "−" : "+"}{taka(Math.abs(p))}</span>;
}

function SizePicker({ item, onSize }: { item: CartItem; onSize: (id: string, size: string) => void }) {
  const sizes = item.sizes ?? [];
  if (sizes.length === 0) return <span className="text-muted-foreground">{item.size || "—"}</span>;
  return (
    <div className="flex max-w-[200px] flex-wrap gap-1" role="radiogroup" aria-label={`Size for ${item.name}`}>
      {sizes.map((z) => {
        const active = item.size === z;
        return (
          <button key={z} type="button" role="radio" aria-checked={active} onClick={() => onSize(item.productId, active ? "" : z)}
            className={cn("h-7 min-w-8 cursor-pointer rounded-lg border px-1.5 text-xs font-bold transition", active ? "border-navy bg-navy text-white" : "bg-card text-navy hover:border-blue/50 hover:bg-accent", !item.size && "border-amber-300")}>
            {z}
          </button>
        );
      })}
    </div>
  );
}

function PriceInput({ item, onPrice }: { item: CartItem; onPrice: (id: string, price: number) => void }) {
  return (
    <div className="relative inline-block">
      <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-xs text-muted-foreground">৳</span>
      <input type="number" min={0} step="0.01" value={item.price || ""} placeholder="0" onChange={(e) => onPrice(item.productId, Number(e.target.value || 0))} onFocus={(e) => e.target.select()}
        className="h-9 w-24 rounded-xl border bg-card pr-2 pl-6 text-right text-sm tabular outline-none focus:border-blue focus:ring-2 focus:ring-blue/15" aria-label="Sale price" />
    </div>
  );
}

function DiscountInput({ item, onDiscount }: { item: CartItem; onDiscount: (id: string, d: number) => void }) {
  return (
    <div className="relative inline-block">
      <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-xs text-muted-foreground">৳</span>
      <input type="number" min={0} value={item.discount || ""} placeholder="0" onChange={(e) => onDiscount(item.productId, Number(e.target.value))} onFocus={(e) => e.target.select()}
        className="h-9 w-20 rounded-xl border bg-card pr-2 pl-6 text-right text-sm tabular outline-none focus:border-blue focus:ring-2 focus:ring-blue/15" aria-label="Discount" />
    </div>
  );
}

export function POSCart({ items, lastAdded, onQty, onSize, onCode, onPrice, onDiscount, onRemove }: Props) {
  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-4 grid size-20 place-items-center rounded-3xl bg-accent text-royal"><ShoppingBag className="size-9" /></motion.div>
        <p className="text-lg font-bold text-navy">Cart is empty</p>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">Scan a barcode or type a product code like <span className="rounded bg-muted px-1.5 font-mono font-semibold">BSS</span> or <span className="rounded bg-muted px-1.5 font-mono font-semibold">BSS*3</span> and press Enter.</p>
      </div>
    );
  }
  return (
    <>
      <div className="hidden flex-1 overflow-auto scrollbar-thin md:block">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
            <tr className="border-b text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
              <th className="px-4 py-3 text-left">Product</th><th className="px-2 py-3 text-left">Code</th><th className="px-2 py-3 text-left">Size</th><th className="px-2 py-3 text-left">Color</th>
              <th className="px-2 py-3 text-center">Qty</th><th className="px-2 py-3 text-right">Cost</th><th className="px-2 py-3 text-right">Price</th><th className="px-2 py-3 text-right">Discount</th><th className="px-2 py-3 text-right">Total</th><th className="px-2 py-3 text-right">Profit</th><th className="w-12 px-2 py-3" />
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {items.map((i) => (
                <motion.tr key={i.productId} layout initial={{ opacity: 0, backgroundColor: "rgba(37,99,235,0.12)" }} animate={{ opacity: 1, backgroundColor: lastAdded === i.productId ? "rgba(37,99,235,0.06)" : "rgba(255,255,255,0)" }} exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.25 }} className="border-b border-border/60">
                  <td className="px-4 py-2.5"><p className="max-w-[220px] truncate font-semibold text-navy">{i.name}</p><p className={cn("text-[11px]", i.stock <= i.quantity ? "text-amber-600" : "text-muted-foreground")}>{i.stock} in stock</p></td>
                  <td className="px-2 py-2.5"><CodeInput item={i} onCode={onCode} /></td>
                  <td className="px-2 py-2.5"><SizePicker item={i} onSize={onSize} /></td>
                  <td className="px-2 py-2.5">{i.color || "—"}</td>
                  <td className="px-2 py-2.5 text-center"><QtyControl item={i} onQty={onQty} /></td>
                  <td className="px-2 py-2.5 text-right tabular text-muted-foreground">{taka(i.costPrice)}</td>
                  <td className="px-2 py-2.5 text-right"><PriceInput item={i} onPrice={onPrice} /></td>
                  <td className="px-2 py-2.5 text-right"><DiscountInput item={i} onDiscount={onDiscount} /></td>
                  <td className="px-2 py-2.5 text-right font-bold tabular text-navy">{taka(lineTotal(i))}</td>
                  <td className="px-2 py-2.5 text-right"><Profit item={i} /></td>
                  <td className="px-2 py-2.5 text-center"><button onClick={() => onRemove(i.productId)} className="grid size-9 cursor-pointer place-items-center rounded-xl text-muted-foreground transition hover:bg-red-50 hover:text-red-600" aria-label={`Remove ${i.name}`}><Trash2 className="size-4" /></button></td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      <div className="flex-1 divide-y overflow-auto md:hidden">
        <AnimatePresence initial={false}>
          {items.map((i) => (
            <motion.div key={i.productId} layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 24 }} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><p className="truncate font-semibold text-navy">{i.name}</p><div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground"><CodeInput item={i} onCode={onCode} /><Profit item={i} /></div><p className="mt-1 text-xs text-muted-foreground">{i.stock} in stock{i.color && ` · ${i.color}`} · cost {taka(i.costPrice)}</p>{(i.sizes?.length ?? 0) > 0 && <div className="mt-2"><SizePicker item={i} onSize={onSize} /></div>}</div>
                <button onClick={() => onRemove(i.productId)} className="rounded-lg p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600 cursor-pointer" aria-label="Remove"><Trash2 className="size-4" /></button>
              </div>
              <div className="flex items-center justify-between gap-2"><QtyControl item={i} onQty={onQty} /><PriceInput item={i} onPrice={onPrice} /><DiscountInput item={i} onDiscount={onDiscount} /><p className="font-bold tabular text-navy">{taka(lineTotal(i))}</p></div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
