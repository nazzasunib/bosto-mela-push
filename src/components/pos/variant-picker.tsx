"use client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { taka } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";

/** Shown when a code matches several products (e.g. same code in different sizes/colours). */
export function VariantPicker({ options, quantity, onPick, onClose }: { options: Product[]; quantity: number; onPick: (p: Product) => void; onClose: () => void }) {
  return (
    <Dialog open={options.length > 0} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Choose variant</DialogTitle><DialogDescription>{options.length} products match this code. Adding × {quantity}.</DialogDescription></DialogHeader>
        <div className="grid gap-2">
          {options.map((p, i) => (
            <button key={p.id} autoFocus={i === 0} disabled={p.stock_quantity <= 0} onClick={() => onPick(p)}
              className={cn("flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 text-left transition hover:border-blue hover:bg-accent focus-visible:border-blue focus-visible:bg-accent outline-none disabled:cursor-not-allowed disabled:opacity-50")}>
              <div className="min-w-0"><p className="truncate font-semibold text-navy">{p.name}</p><p className="text-xs text-muted-foreground"><b className="font-mono text-royal">{p.code}</b> · {p.category} · Cost <b>{taka(p.cost_price)}</b> · Size <b>{p.size || "—"}</b> · Color <b>{p.color || "—"}</b>{p.barcode && ` · ${p.barcode}`}</p></div>
              <div className="shrink-0 text-right"><p className="font-bold tabular">{p.selling_price > 0 ? taka(p.selling_price) : "Custom"}</p><p className="text-xs text-muted-foreground">{p.stock_quantity} in stock</p></div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
