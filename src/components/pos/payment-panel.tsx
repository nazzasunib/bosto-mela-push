"use client";
import { forwardRef } from "react";
import { motion } from "framer-motion";
import { Banknote, CheckCircle2, CreditCard, Loader2, Smartphone, Wallet, CircleEllipsis, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { changeDue, type CartTotals } from "@/lib/calc";
import { PAYMENT_LABELS, taka } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PaymentMethod } from "@/lib/types";

const METHODS: { key: PaymentMethod; icon: LucideIcon; color: string }[] = [
  { key: "cash", icon: Banknote, color: "text-emerald-600" },
  { key: "bkash", icon: Smartphone, color: "text-pink-600" },
  { key: "nagad", icon: Wallet, color: "text-orange-600" },
  { key: "card", icon: CreditCard, color: "text-blue" },
  { key: "other", icon: CircleEllipsis, color: "text-slate-500" },
];

interface Props {
  totals: CartTotals; method: PaymentMethod; paid: string; orderDiscount: number; phone: string; busy: boolean;
  onChange: (p: { method?: PaymentMethod; paid?: string; orderDiscount?: number; phone?: string }) => void; onComplete: () => void;
}

function Row({ label, value, strong, muted }: { label: string; value: string; strong?: boolean; muted?: boolean }) {
  return <div className={cn("flex items-center justify-between", strong ? "text-base font-bold text-navy" : "text-sm", muted && "text-muted-foreground")}><span>{label}</span><span className="tabular">{value}</span></div>;
}

export const PaymentPanel = forwardRef<HTMLInputElement, Props>(function PaymentPanel({ totals, method, paid, orderDiscount, phone, busy, onChange, onComplete }, paidRef) {
  const paidNum = paid === "" ? totals.total : Number(paid);
  const change = changeDue(totals.total, Number.isFinite(paidNum) ? paidNum : 0);
  const short = Number.isFinite(paidNum) && paidNum < totals.total;
  const quick = [...new Set([totals.total, Math.ceil(totals.total / 100) * 100, Math.ceil(totals.total / 500) * 500, Math.ceil(totals.total / 1000) * 1000])].filter((v) => v > 0).slice(0, 4);
  const empty = totals.items === 0;

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="space-y-2 rounded-2xl bg-secondary/70 p-4">
        <Row label={`Subtotal (${totals.items} items)`} value={taka(totals.subtotal)} />
        <Row label="Item discounts" value={`− ${taka(totals.itemDiscount)}`} muted />
        <div className="flex items-center justify-between text-sm">
          <span>Extra discount</span>
          <div className="relative"><span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-xs text-muted-foreground">৳</span>
            <input type="number" min={0} value={orderDiscount || ""} placeholder="0" onChange={(e) => onChange({ orderDiscount: Math.max(Number(e.target.value) || 0, 0) })} onFocus={(e) => e.target.select()} className="h-8 w-24 rounded-lg border bg-card pr-2 pl-6 text-right text-sm tabular outline-none focus:border-blue" aria-label="Extra discount" />
          </div>
        </div>
        <Row label="Total discount" value={`− ${taka(totals.discount)}`} muted />
        <div className="my-1 h-px bg-border" />
        <div className="flex items-end justify-between">
          <span className="text-sm font-semibold text-muted-foreground">Grand Total</span>
          <motion.span key={totals.total} initial={{ scale: 1.08, color: "#2563EB" }} animate={{ scale: 1, color: "#0B1F3A" }} className="text-3xl font-extrabold tracking-tight tabular">{taka(totals.total)}</motion.span>
        </div>
        <Row label="Est. profit" value={taka(totals.profit)} muted />
      </div>

      <div>
        <p className="mb-2 text-[13px] font-semibold text-foreground/80">Payment method</p>
        <div className="grid grid-cols-5 gap-1.5">
          {METHODS.map((m) => {
            const Icon = m.icon; const on = method === m.key;
            return (
              <button key={m.key} onClick={() => onChange({ method: m.key })} className={cn("flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 px-1 py-2.5 text-[11px] font-bold transition-all active:scale-95", on ? "border-blue bg-accent text-navy shadow-soft" : "border-transparent bg-secondary/70 text-muted-foreground hover:bg-accent")}>
                <Icon className={cn("size-5", on ? m.color : "")} />{PAYMENT_LABELS[m.key]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold text-foreground/80">Amount paid</span>
          <div className="relative"><span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 font-semibold text-muted-foreground">৳</span>
            <input ref={paidRef} type="number" min={0} value={paid} placeholder={String(totals.total)} onChange={(e) => onChange({ paid: e.target.value })} onFocus={(e) => e.target.select()}
              className={cn("h-12 w-full rounded-xl border-2 bg-card pr-3 pl-8 text-lg font-bold tabular outline-none focus:border-blue", short ? "border-red-300" : "border-input")} aria-label="Amount paid" />
          </div>
        </label>
        <div>
          <span className="mb-1.5 block text-[13px] font-semibold text-foreground/80">Change due</span>
          <div className={cn("flex h-12 items-center rounded-xl px-3 text-lg font-extrabold tabular", short ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700")}>{short ? `Short ${taka(totals.total - paidNum)}` : taka(change)}</div>
        </div>
      </div>
      {!empty && <div className="flex flex-wrap gap-1.5">{quick.map((v, i) => <button key={v} onClick={() => onChange({ paid: String(v) })} className="cursor-pointer rounded-lg border bg-card px-2.5 py-1 text-xs font-semibold tabular transition hover:border-blue/40 hover:bg-accent">{i === 0 ? "Exact" : taka(v)}</button>)}</div>}

      <input value={phone} onChange={(e) => onChange({ phone: e.target.value })} placeholder="Customer phone (optional)" inputMode="tel" className="h-10 rounded-xl border bg-card px-3 text-sm outline-none focus:border-blue" aria-label="Customer phone" />

      <div className="mt-auto">
        <Button size="xl" variant="success" className="h-16 w-full text-lg shadow-lift" disabled={empty || busy || short} onClick={onComplete}>
          {busy ? <Loader2 className="size-6 animate-spin" /> : <CheckCircle2 className="size-6" />}
          {busy ? "Saving…" : "Complete Sale"}
        </Button>
        <p className="mt-2 text-center text-[11px] text-muted-foreground"><kbd className="rounded bg-muted px-1.5 py-0.5 font-bold">Ctrl</kbd> + <kbd className="rounded bg-muted px-1.5 py-0.5 font-bold">Enter</kbd> to complete · <kbd className="rounded bg-muted px-1.5 py-0.5 font-bold">F4</kbd> amount paid</p>
      </div>
    </div>
  );
});
