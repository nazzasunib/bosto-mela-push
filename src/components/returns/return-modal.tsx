"use client";
import { useMemo, useState } from "react";
import { Loader2, Minus, Plus, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/common/field";
import { processReturn } from "@/lib/actions/pos";
import { refundFor, round2 } from "@/lib/calc";
import { REASON_LABELS, taka } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ReturnReason, SaleWithItems } from "@/lib/types";

export function ReturnModal({ sale, open, onOpenChange, onDone }: { sale: SaleWithItems; open: boolean; onOpenChange: (o: boolean) => void; onDone: (returnNo: string, refund: number) => void }) {
  const [qty, setQty] = useState<Record<string, number>>({});
  const [reason, setReason] = useState<ReturnReason>("size_issue");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const lines = sale.sale_items.map((i) => ({ ...i, left: i.quantity - i.returned_qty, sel: qty[i.id] ?? 0 }));
  const refund = useMemo(() => round2(lines.reduce((s, l) => s + (l.sel > 0 ? refundFor(l.net_total, l.quantity, l.returned_qty, l.sel) : 0), 0)), [lines]);
  const count = lines.reduce((s, l) => s + l.sel, 0);
  const set = (id: string, v: number, max: number) => setQty((q) => ({ ...q, [id]: Math.max(0, Math.min(max, Math.trunc(v) || 0)) }));

  const submit = async () => {
    if (count === 0) { toast.error("Select at least one item to return."); return; }
    setBusy(true);
    const res = await processReturn({ saleId: sale.id, items: lines.filter((l) => l.sel > 0).map((l) => ({ saleItemId: l.id, quantity: l.sel })), reason, note });
    setBusy(false);
    if (!res.ok) { toast.error(res.error); return; }
    setQty({}); setNote(""); onDone(res.data.return_no, res.data.refund_amount);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Return items</DialogTitle><DialogDescription>Invoice <b className="font-mono">{sale.invoice_no}</b> — choose products and quantities to return.</DialogDescription></DialogHeader>
        <div className="divide-y rounded-2xl border">
          {lines.map((l) => (
            <div key={l.id} className={cn("flex flex-col gap-3 p-3 sm:flex-row sm:items-center", l.left === 0 && "opacity-50")}>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-navy">{l.product_name}</p>
                <p className="text-xs text-muted-foreground"><span className="font-mono font-bold text-royal">{l.product_code}</span>{l.size && ` · ${l.size}`}{l.color && ` · ${l.color}`} · sold {l.quantity} · paid {taka(l.net_total)}{l.returned_qty > 0 && ` · already returned ${l.returned_qty}`}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center rounded-xl border">
                  <button disabled={l.sel <= 0} onClick={() => set(l.id, l.sel - 1, l.left)} className="grid size-9 cursor-pointer place-items-center disabled:opacity-30" aria-label="Less"><Minus className="size-3.5" /></button>
                  <input type="number" value={l.sel} min={0} max={l.left} disabled={l.left === 0} onChange={(e) => set(l.id, Number(e.target.value), l.left)} className="h-9 w-12 border-x text-center font-bold tabular outline-none" aria-label="Return quantity" />
                  <button disabled={l.sel >= l.left} onClick={() => set(l.id, l.sel + 1, l.left)} className="grid size-9 cursor-pointer place-items-center disabled:opacity-30" aria-label="More"><Plus className="size-3.5" /></button>
                </div>
                <Button size="sm" variant="ghost" disabled={l.left === 0} onClick={() => set(l.id, l.left, l.left)}>All {l.left}</Button>
              </div>
            </div>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Return reason">
            <Select value={reason} onValueChange={(v) => setReason(v as ReturnReason)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{(Object.keys(REASON_LABELS) as ReturnReason[]).map((r) => <SelectItem key={r} value={r}>{REASON_LABELS[r]}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Note (optional)" htmlFor="ret-note"><Input id="ret-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Exchanged for size L…" /></Field>
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-600/15">
          <div><p className="text-sm font-semibold text-amber-800">Refund to customer</p><p className="text-xs text-amber-700">{count} item(s) · stock will be added back</p></div>
          <p className="text-2xl font-extrabold tabular text-amber-800">{taka(refund)}</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button variant="destructive" onClick={submit} disabled={busy || count === 0}>{busy ? <Loader2 className="animate-spin" /> : <RotateCcw />}Confirm Return</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
