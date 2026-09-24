"use client";
import { useState } from "react";
import { Loader2, PackagePlus, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/common/field";
import { adjustStock } from "@/lib/actions/catalog";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";

export function StockAdjustDialog({ product, onClose }: { product: Product | null; onClose: (changed: boolean) => void }) {
  const [type, setType] = useState<"stock_in" | "adjustment">("stock_in");
  const [qty, setQty] = useState("");
  const [direction, setDirection] = useState<1 | -1>(-1);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const q = Math.trunc(Number(qty)) || 0;
  const signed = type === "stock_in" ? q : q * direction;
  const after = (product?.stock_quantity ?? 0) + signed;

  const reset = () => { setQty(""); setNote(""); setType("stock_in"); setDirection(-1); };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || q <= 0) { toast.error("Enter a quantity greater than 0."); return; }
    if (after < 0) { toast.error("Stock cannot go below zero."); return; }
    setBusy(true);
    const res = await adjustStock({ productId: product.id, quantity: signed, type, note });
    setBusy(false);
    if (!res.ok) { toast.error(res.error); return; }
    toast.success(`Stock updated — ${product.code} now ${res.data.stock}`);
    reset(); onClose(true);
  };

  return (
    <Dialog open={!!product} onOpenChange={(o) => { if (!o) { reset(); onClose(false); } }}>
      <DialogContent className="max-w-md">
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader><DialogTitle>Update stock</DialogTitle><DialogDescription>{product?.name} · <span className="font-mono font-bold">{product?.code}</span> · current stock <b>{product?.stock_quantity}</b></DialogDescription></DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {([["stock_in", "Stock In", PackagePlus], ["adjustment", "Adjustment", SlidersHorizontal]] as const).map(([k, label, Icon]) => (
              <button key={k} type="button" onClick={() => setType(k)} className={cn("flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 p-3 text-sm font-bold transition", type === k ? "border-blue bg-accent text-navy" : "border-transparent bg-secondary text-muted-foreground")}><Icon className="size-4" />{label}</button>
            ))}
          </div>
          {type === "adjustment" && (
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant={direction === -1 ? "destructive" : "outline"} onClick={() => setDirection(-1)}>Remove (−)</Button>
              <Button type="button" variant={direction === 1 ? "success" : "outline"} onClick={() => setDirection(1)}>Add (+)</Button>
            </div>
          )}
          <Field label="Quantity" htmlFor="adj-qty"><Input id="adj-qty" type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} autoFocus className="h-12 text-lg font-bold" /></Field>
          <Field label="Note" htmlFor="adj-note"><Input id="adj-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder={type === "stock_in" ? "Supplier / memo no." : "Damaged, counted, lost…"} /></Field>
          <div className="flex items-center justify-between rounded-xl bg-secondary/70 px-4 py-3 text-sm"><span className="text-muted-foreground">Stock after update</span><b className={cn("text-lg tabular", after < 0 ? "text-red-600" : "text-navy")}>{after}</b></div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => { reset(); onClose(false); }}>Cancel</Button><Button type="submit" disabled={busy || q <= 0}>{busy && <Loader2 className="animate-spin" />}Save</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
