"use client";
import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Barcode, CornerDownLeft, PackageSearch, ScanLine, Search } from "lucide-react";
import { normalizeCode, parseMultiInput, parseQuantityInput } from "@/lib/code-parser";
import { taka } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";

export interface ProductSearchHandle { focus: () => void }

interface Props {
  products: Product[];
  /** Called with a resolved product (or a list when a code matches several variants). */
  onPick: (matches: Product[], quantity: number, term: string) => void;
}

function exactMatches(products: Product[], term: string): Product[] {
  const t = normalizeCode(term);
  if (!t) return [];
  const byBarcode = products.filter((p) => p.barcode && normalizeCode(p.barcode) === t);
  if (byBarcode.length) return byBarcode;
  return products.filter((p) => normalizeCode(p.code) === t);
}

function fuzzy(products: Product[], term: string): Product[] {
  const t = term.trim().toLowerCase();
  if (!t) return [];
  const words = t.split(/\s+/);
  return products
    .map((p) => {
      const hay = `${p.name} ${p.code} ${p.barcode ?? ""} ${p.category} ${p.size} ${p.color}`.toLowerCase();
      if (!words.every((w) => hay.includes(w))) return null;
      const code = p.code.toLowerCase();
      const score = code === t ? 0 : code.startsWith(t) ? 1 : p.name.toLowerCase().startsWith(t) ? 2 : 3;
      return { p, score };
    })
    .filter((x): x is { p: Product; score: number } => x !== null)
    .sort((a, b) => a.score - b.score || a.p.name.localeCompare(b.p.name))
    .slice(0, 8)
    .map((x) => x.p);
}

export const ProductSearch = forwardRef<ProductSearchHandle, Props>(function ProductSearch({ products, onPick }, ref) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const [navigated, setNavigated] = useState(false);
  const [shake, setShake] = useState(0);
  useImperativeHandle(ref, () => ({ focus: () => inputRef.current?.focus() }));

  const { term, quantity } = parseQuantityInput(value);
  const results = useMemo(() => fuzzy(products, term), [products, term]);

  const commit = (picked?: Product) => {
    if (!term) return;
    const parts = picked ? [] : parseMultiInput(value);
    // only treat as multi-entry when every part is an exact code/barcode (so "Cotton Panjabi*2" still searches by name)
    const multi = parts.length > 1 && parts.every((m) => exactMatches(products, m.term).length > 0) ? parts : [];
    if (multi.length > 1) {
      // "BSS*3 RBS*2, HTS" → add each entry by exact code/barcode
      for (const m of multi) onPick(exactMatches(products, m.term), m.quantity, m.term);
    } else if (picked) { onPick([picked], quantity, term); }
    else if (navigated && open && results[hi]) { onPick([results[hi]], quantity, term); }
    else {
      const exact = exactMatches(products, term);
      if (exact.length) onPick(exact, quantity, term);
      else if (results.length === 1) onPick(results, quantity, term);
      else if (results.length > 1 && open) onPick([results[Math.min(hi, results.length - 1)]], quantity, term);
      else { onPick([], quantity, term); setShake((s) => s + 1); return; }
    }
    setValue(""); setHi(0); setNavigated(false); setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); commit(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setNavigated(true); setHi((h) => Math.min(h + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setNavigated(true); setHi((h) => Math.max(h - 1, 0)); }
    else if (e.key === "Escape") { if (value) { e.stopPropagation(); setValue(""); } setOpen(false); }
  };

  return (
    <div className="relative">
      <motion.div key={shake} animate={shake ? { x: [0, -8, 8, -5, 5, 0] } : {}} transition={{ duration: 0.3 }}
        className="relative flex items-center rounded-2xl border-2 border-blue/20 bg-card shadow-soft transition focus-within:border-blue focus-within:shadow-[0_0_0_4px_rgb(37_99_235/0.12)]">
        <ScanLine className="ml-4 size-6 shrink-0 text-blue" />
        <input ref={inputRef} value={value} autoFocus autoComplete="off" spellCheck={false} placeholder="Search or scan product…  (e.g. BSS*2)"
          onChange={(e) => { setValue(e.target.value); setOpen(true); setHi(0); setNavigated(false); }} onKeyDown={onKeyDown} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="h-16 w-full bg-transparent px-4 text-lg font-semibold text-navy outline-none placeholder:font-normal placeholder:text-muted-foreground/70" aria-label="Search or scan product" />
        {quantity > 1 && term && <span className="mr-2 shrink-0 rounded-lg bg-blue px-2.5 py-1 text-sm font-bold text-white">× {quantity}</span>}
        <kbd className="mr-4 hidden shrink-0 items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs font-bold text-muted-foreground sm:flex"><CornerDownLeft className="size-3" />Enter</kbd>
      </motion.div>

      <AnimatePresence>
        {open && term && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.12 }}
            className="absolute inset-x-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-2xl border bg-popover shadow-lift">
            {results.length === 0 ? (
              <div className="flex items-center gap-3 p-4 text-sm text-muted-foreground"><PackageSearch className="size-5" />No product matches “{term}”. Press Enter to try exact code/barcode.</div>
            ) : (
              <ul className="max-h-[360px] overflow-y-auto scrollbar-thin p-1.5">
                {results.map((p, i) => (
                  <li key={p.id}>
                    <button onMouseDown={(e) => e.preventDefault()} onMouseEnter={() => setHi(i)} onClick={() => commit(p)}
                      className={cn("flex w-full cursor-pointer items-center gap-3 rounded-xl p-2.5 text-left transition-colors", i === hi ? "bg-accent" : "hover:bg-muted")}>
                      <div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-secondary text-royal">
                        {p.image_url ? <img src={p.image_url} alt="" className="size-full object-cover" /> : <Barcode className="size-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-navy">{p.name}</p>
                        <p className="truncate text-xs text-muted-foreground"><span className="font-mono font-semibold text-royal">{p.code}</span>{p.size && ` · ${p.size}`}{p.color && ` · ${p.color}`}{p.barcode && ` · ${p.barcode}`}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-bold tabular text-navy">{p.selling_price > 0 ? taka(p.selling_price) : "Custom"}</p>
                        <p className={cn("text-xs font-semibold", p.stock_quantity <= 0 ? "text-red-600" : "text-muted-foreground")}>{p.stock_quantity <= 0 ? "Out of stock" : `${p.stock_quantity} in stock`}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex items-center gap-4 border-t bg-muted/50 px-4 py-2 text-[11px] text-muted-foreground"><span><b>↑↓</b> select</span><span><b>Enter</b> add</span><span><b>CODE*3</b> quantity</span><span className="ml-auto flex items-center gap-1"><Search className="size-3" />{results.length} found</span></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
