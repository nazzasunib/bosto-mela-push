"use client";
import { motion } from "framer-motion";
import { Check, Plus, Printer } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PAYMENT_LABELS, taka } from "@/lib/format";
import type { SaleWithItems } from "@/lib/types";

export function openInvoice(id: string, print = true) {
  window.open(`/invoice/${id}${print ? "?print=1" : ""}`, "_blank", "noopener,width=460,height=760");
}

export function SaleSuccessModal({ sale, onClose }: { sale: SaleWithItems | null; onClose: () => void }) {
  return (
    <Dialog open={!!sale} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm text-center" showClose={false} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onClose(); } }}>
        {sale && (
          <>
            <div className="relative mx-auto mt-2 grid size-24 place-items-center">
              <motion.span className="absolute inset-0 rounded-full bg-emerald-100" initial={{ scale: 0 }} animate={{ scale: [0, 1.15, 1] }} transition={{ duration: 0.5 }} />
              <motion.span className="absolute inset-0 rounded-full border-4 border-emerald-400/40" initial={{ scale: 0.6, opacity: 1 }} animate={{ scale: 1.6, opacity: 0 }} transition={{ duration: 0.9, delay: 0.2 }} />
              <motion.div className="relative grid size-16 place-items-center rounded-full bg-emerald-500 text-white shadow-lg" initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}>
                <Check className="size-9" strokeWidth={3} />
              </motion.div>
            </div>
            <DialogTitle className="text-2xl">Sale completed!</DialogTitle>
            <DialogDescription className="font-mono text-base font-semibold text-royal">{sale.invoice_no}</DialogDescription>
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-secondary/70 p-4 text-left text-sm">
              <span className="text-muted-foreground">Total</span><span className="text-right font-bold tabular text-navy">{taka(sale.total)}</span>
              <span className="text-muted-foreground">Paid ({PAYMENT_LABELS[sale.payment_method]})</span><span className="text-right font-semibold tabular">{taka(sale.amount_paid)}</span>
              <span className="text-muted-foreground">Change</span><span className="text-right text-lg font-extrabold tabular text-emerald-600">{taka(sale.change_due)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="lg" onClick={() => openInvoice(sale.id)}><Printer />Print</Button>
              <Button size="lg" autoFocus onClick={onClose}><Plus />New Sale</Button>
            </div>
            <p className="text-[11px] text-muted-foreground">Press Enter to start the next sale</p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
