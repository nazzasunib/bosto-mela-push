"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Banknote, CalendarCheck, CheckCircle2, CreditCard, Loader2, Lock, Printer, Smartphone, Wallet, CircleEllipsis } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/common/page-header";
import { DataTable } from "@/components/common/data-table";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { closeDay } from "@/lib/actions/admin";
import { formatDate, formatDateTime, taka } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DailyClosing, PaymentMethod, Summary } from "@/lib/types";

const PAY: { k: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { k: "cash", label: "Cash", icon: Banknote }, { k: "bkash", label: "bKash", icon: Smartphone }, { k: "nagad", label: "Nagad", icon: Wallet }, { k: "card", label: "Card", icon: CreditCard }, { k: "other", label: "Other", icon: CircleEllipsis },
];

export function ClosingView({ date, today, summary, closing, history }: { date: string; today: string; summary: Summary; closing: DailyClosing | null; history: DailyClosing[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [note, setNote] = useState("");
  const [confirm, setConfirm] = useState(false);
  const snap = closing
    ? { sales: closing.total_sales, cost: closing.total_cost, gross: closing.gross_profit, expenses: closing.expenses, returns: closing.returns, adj: closing.return_adjustment, net: closing.net_profit, orders: closing.orders, items: closing.items_sold, pay: { cash: closing.cash, bkash: closing.bkash, nagad: closing.nagad, card: closing.card, other: closing.other } }
    : { sales: summary.sales, cost: summary.cost, gross: summary.grossProfit, expenses: summary.expenses, returns: summary.returns, adj: summary.returnAdjustment, net: summary.netProfit, orders: summary.orders, items: summary.items, pay: summary.payments };
  const drift = closing && (Math.abs(closing.total_sales - summary.sales) > 0.009 || Math.abs(closing.net_profit - summary.netProfit) > 0.009);

  const lines: [string, number, string?][] = [["Total Sales", snap.sales], ["Total Cost", -snap.cost, "text-muted-foreground"], ["Gross Profit", snap.gross, "font-bold"], ["Expenses", -snap.expenses, "text-amber-700"], ["Returns (refunded)", -snap.returns, "text-red-600"], ["Return profit adjustment", -snap.adj, "text-red-600"]];

  return (
    <>
      <div className="no-print">
        <PageHeader title="Daily Closing" description="Check the day's totals and close the day. History is never deleted." icon={CalendarCheck}
          actions={<><Input type="date" value={date} max={today} onChange={(e) => e.target.value && start(() => router.push(`/reports/closing?date=${e.target.value}`))} className="w-[170px]" />{pending && <Loader2 className="size-4 animate-spin text-blue" />}<Button variant="outline" onClick={() => window.print()}><Printer />Print</Button></>} />
      </div>
      <div className="print-only mb-4"><h1 className="text-xl font-extrabold">Bosto Mela PoS — Daily Closing</h1><p>{formatDate(date)}</p></div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{formatDate(date)}</CardTitle>
            {closing ? <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-600/20"><Lock className="size-3" />Closed {formatDateTime(closing.closed_at)}</span> : <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-600/20">Open</span>}
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="mb-3 text-sm text-muted-foreground">{snap.orders} orders · {snap.items} items sold</p>
            {lines.map(([k, v, cls]) => <div key={k} className={cn("flex justify-between border-b border-dashed py-2 text-sm", cls)}><span>{k}</span><span className="tabular">{v < 0 ? `− ${taka(-v)}` : taka(v)}</span></div>)}
            <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={cn("mt-4 flex items-center justify-between rounded-2xl p-5 text-white", snap.net < 0 ? "bg-red-600" : "brand-mesh")}>
              <span className="font-semibold">Net Profit</span><span className="text-3xl font-extrabold tabular">{taka(snap.net)}</span>
            </motion.div>
            {drift && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">Figures changed after closing (e.g. a late return). Saved snapshot shown; live totals: sales {taka(summary.sales)}, net {taka(summary.netProfit)}.</p>}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Payment breakdown</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {PAY.map(({ k, label, icon: Icon }) => <div key={k} className="flex items-center justify-between rounded-xl bg-secondary/60 px-3 py-2.5"><span className="flex items-center gap-2 text-sm font-semibold"><Icon className="size-4 text-royal" />{label}</span><b className="tabular">{taka(snap.pay[k])}</b></div>)}
              <p className="pt-1 text-xs text-muted-foreground">Refunds for returns: {taka(snap.returns)} (usually paid from cash)</p>
            </CardContent>
          </Card>
          {!closing && (
            <Card className="no-print">
              <CardContent className="space-y-3 pt-5">
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Closing note (optional) — e.g. cash counted ৳12,300" />
                <Button size="xl" className="w-full" onClick={() => setConfirm(true)}><CheckCircle2 />Close Day</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card className="no-print mt-6 overflow-hidden">
        <CardHeader><CardTitle>Closing history</CardTitle></CardHeader>
        <DataTable rows={history} rowKey={(c) => c.id} onRowClick={(c) => router.push(`/reports/closing?date=${c.closing_date}`)} empty={{ title: "No closed days yet", icon: CalendarCheck }} columns={[
          { key: "d", header: "Date", cell: (c) => <b>{formatDate(c.closing_date)}</b> },
          { key: "o", header: "Orders", align: "center", cell: (c) => c.orders },
          { key: "s", header: "Sales", align: "right", cell: (c) => <span className="tabular">{taka(c.total_sales)}</span> },
          { key: "g", header: "Gross", align: "right", cell: (c) => <span className="tabular">{taka(c.gross_profit)}</span> },
          { key: "e", header: "Expenses", align: "right", cell: (c) => <span className="tabular">{taka(c.expenses)}</span> },
          { key: "n", header: "Net Profit", align: "right", cell: (c) => <b className={cn("tabular", c.net_profit < 0 ? "text-red-600" : "text-emerald-700")}>{taka(c.net_profit)}</b> },
          { key: "c", header: "Cash", align: "right", cell: (c) => <span className="tabular">{taka(c.cash)}</span> },
        ]} />
      </Card>

      <ConfirmDialog open={confirm} onOpenChange={setConfirm} title={`Close ${formatDate(date)}?`} description="A snapshot of today's totals will be saved. Sales and data are kept — nothing is deleted." confirmLabel="Close Day"
        onConfirm={async () => { const res = await closeDay(date, note); if (res.ok) { toast.success("Day closed successfully"); setConfirm(false); router.refresh(); } else toast.error(res.error); }} />
    </>
  );
}
