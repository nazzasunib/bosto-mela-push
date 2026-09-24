"use client";
import Link from "next/link";
import { useMemo } from "react";
import { BarChart3, Banknote, CalendarCheck, Coins, Download, Package, Printer, Receipt, RotateCcw, TrendingUp, Wallet } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/common/page-header";
import { RangeFilter } from "@/components/common/range-filter";
import { StatCard } from "@/components/common/stat-card";
import { DataTable, type Column } from "@/components/common/data-table";
import { StockBadge } from "@/components/common/status-badge";
import { downloadCSV } from "@/lib/csv";
import { EXPENSE_LABELS, PAYMENT_LABELS, REASON_LABELS, formatDate, formatDateTime, num, taka } from "@/lib/format";
import { RANGE_LABELS, type RangeKey } from "@/lib/dates";
import { round2 } from "@/lib/calc";
import type { ChartPoint, Expense, PaymentMethod, Product, ReturnWithInvoice, Sale, Summary } from "@/lib/types";
import type { ProductPerf } from "@/lib/queries/data";

function Toolbar({ onExport }: { onExport: () => void }) {
  return <div className="no-print flex gap-2"><Button size="sm" variant="outline" onClick={onExport}><Download />Export CSV</Button><Button size="sm" variant="outline" onClick={() => window.print()}><Printer />Print</Button></div>;
}

interface DayRow { date: string; orders: number; items: number; sales: number; cost: number; gross: number; returns: number; retAdj: number; expenses: number; net: number }

interface Props { rangeKey: RangeKey; from: string; to: string; summary: Summary; sales: Sale[]; returns: ReturnWithInvoice[]; expenses: Expense[]; chart: ChartPoint[]; top: ProductPerf[]; products: Product[]; threshold: number }

export function ReportsView({ rangeKey, from, to, summary: s, sales, returns, expenses, chart, top, products, threshold }: Props) {
  const period = rangeKey === "custom" ? `${formatDate(from)} – ${formatDate(to)}` : `${RANGE_LABELS[rangeKey]} (${from === to ? formatDate(from) : `${formatDate(from)} – ${formatDate(to)}`})`;
  const tag = `${from}_${to}`;

  const days: DayRow[] = useMemo(() => {
    const m = new Map<string, DayRow>(chart.map((c) => [c.date, { date: c.date, orders: 0, items: 0, sales: 0, cost: 0, gross: 0, returns: 0, retAdj: 0, expenses: 0, net: 0 }]));
    const key = (iso: string) => new Date(new Date(iso).getTime() + 6 * 3600_000).toISOString().slice(0, 10);
    for (const x of sales) { if (x.status === "cancelled") continue; const d = m.get(key(x.created_at)); if (d) { d.orders++; d.items += x.item_count; d.sales = round2(d.sales + x.total); d.cost = round2(d.cost + x.cost_total); d.gross = round2(d.gross + x.gross_profit); } }
    for (const r of returns) { const d = m.get(key(r.created_at)); if (d) { d.returns = round2(d.returns + r.refund_amount); d.retAdj = round2(d.retAdj + r.profit_adjustment); } }
    for (const e of expenses) { const d = m.get(e.expense_date); if (d) d.expenses = round2(d.expenses + e.amount); }
    for (const d of m.values()) d.net = round2(d.gross - d.retAdj - d.expenses);
    return [...m.values()].reverse();
  }, [chart, sales, returns, expenses]);

  const expByCat = useMemo(() => { const m = new Map<string, number>(); for (const e of expenses) m.set(e.category, round2((m.get(e.category) ?? 0) + e.amount)); return [...m.entries()].sort((a, b) => b[1] - a[1]); }, [expenses]);
  const retByReason = useMemo(() => { const m = new Map<string, { n: number; v: number }>(); for (const r of returns) { const x = m.get(r.reason) ?? { n: 0, v: 0 }; x.n += r.item_count; x.v = round2(x.v + r.refund_amount); m.set(r.reason, x); } return [...m.entries()]; }, [returns]);
  const active = products.filter((p) => p.status === "active");
  const stockValue = round2(active.reduce((a, p) => a + Math.max(p.stock_quantity, 0) * p.cost_price, 0));
  const retailValue = round2(active.reduce((a, p) => a + Math.max(p.stock_quantity, 0) * p.selling_price, 0));

  const dayCols = (profit: boolean): Column<DayRow>[] => [
    { key: "d", header: "Date", cell: (d) => formatDate(d.date) },
    ...(profit ? [
      { key: "s", header: "Sales", align: "right", cell: (d: DayRow) => <span className="tabular">{taka(d.sales)}</span> },
      { key: "c", header: "Cost", align: "right", cell: (d: DayRow) => <span className="tabular text-muted-foreground">{taka(d.cost)}</span> },
      { key: "g", header: "Gross Profit", align: "right", cell: (d: DayRow) => <span className="tabular">{taka(d.gross)}</span> },
      { key: "ra", header: "Return Adj.", align: "right", cell: (d: DayRow) => <span className="tabular text-red-600">{d.retAdj ? `−${taka(d.retAdj)}` : "—"}</span> },
      { key: "e", header: "Expenses", align: "right", cell: (d: DayRow) => <span className="tabular text-amber-700">{d.expenses ? `−${taka(d.expenses)}` : "—"}</span> },
      { key: "n", header: "Net Profit", align: "right", cell: (d: DayRow) => <b className={`tabular ${d.net < 0 ? "text-red-600" : "text-emerald-700"}`}>{taka(d.net)}</b> },
    ] as Column<DayRow>[] : [
      { key: "o", header: "Orders", align: "center", cell: (d: DayRow) => d.orders },
      { key: "i", header: "Items", align: "center", cell: (d: DayRow) => d.items },
      { key: "s", header: "Sales", align: "right", cell: (d: DayRow) => <span className="tabular">{taka(d.sales)}</span> },
      { key: "r", header: "Returns", align: "right", cell: (d: DayRow) => <span className="tabular text-red-600">{d.returns ? `−${taka(d.returns)}` : "—"}</span> },
      { key: "n", header: "Net Sales", align: "right", cell: (d: DayRow) => <b className="tabular">{taka(d.sales - d.returns)}</b> },
    ] as Column<DayRow>[]),
  ];

  const exportSales = () => downloadCSV(`sales-report_${tag}.csv`, ["Invoice", "Date", "Items", "Subtotal", "Discount", "Total", "Returned", "Cost", "Gross Profit", "Payment", "Status"],
    sales.map((x) => [x.invoice_no, formatDateTime(x.created_at), x.item_count, x.subtotal, x.discount_total, x.total, x.returned_amount, x.cost_total, x.gross_profit, PAYMENT_LABELS[x.payment_method], x.status]));
  const exportProfit = () => downloadCSV(`profit-report_${tag}.csv`, ["Date", "Sales", "Cost", "Gross Profit", "Return Adjustment", "Expenses", "Net Profit"], days.map((d) => [d.date, d.sales, d.cost, d.gross, d.retAdj, d.expenses, d.net]));
  const exportExpenses = () => downloadCSV(`expense-report_${tag}.csv`, ["Date", "Category", "Amount", "Note"], expenses.map((e) => [e.expense_date, EXPENSE_LABELS[e.category], e.amount, e.note ?? ""]));
  const exportStock = () => downloadCSV(`stock-report_${from}.csv`, ["Product", "Code", "Category", "Size", "Color", "Stock", "Cost", "Price", "Stock Value"], active.map((p) => [p.name, p.code, p.category, p.size, p.color, p.stock_quantity, p.cost_price, p.selling_price, round2(Math.max(p.stock_quantity, 0) * p.cost_price)]));
  const exportReturns = () => downloadCSV(`return-report_${tag}.csv`, ["Return No", "Date", "Invoice", "Reason", "Items", "Refund", "Profit Adjustment", "Note"], returns.map((r) => [r.return_no, formatDateTime(r.created_at), r.invoice_no, REASON_LABELS[r.reason], r.item_count, r.refund_amount, r.profit_adjustment, r.note ?? ""]));

  return (
    <>
      <div className="no-print"><PageHeader title="Reports" description={period} icon={BarChart3} actions={<><RangeFilter value={rangeKey} from={from} to={to} /><Button asChild variant="outline"><Link href="/reports/closing"><CalendarCheck />Daily Closing</Link></Button></>} /></div>
      <div className="print-only mb-4"><h1 className="text-xl font-extrabold">Bosto Mela PoS — Report</h1><p className="text-sm">{period}</p></div>
      <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-6">
        <StatCard index={0} label="Sales" value={s.sales} currency icon={Banknote} highlight hint={`${s.orders} orders · ${s.items} items`} />
        <StatCard index={1} label="Cost" value={s.cost} currency icon={Package} tone="violet" />
        <StatCard index={2} label="Gross Profit" value={s.grossProfit} currency icon={TrendingUp} tone="green" />
        <StatCard index={3} label="Expenses" value={s.expenses} currency icon={Wallet} tone="amber" />
        <StatCard index={4} label="Returns" value={s.returns} currency icon={RotateCcw} tone="red" hint={`Profit adj. −${taka(s.returnAdjustment)}`} />
        <StatCard index={5} label="Net Profit" value={s.netProfit} currency icon={Coins} tone="green" negative={s.netProfit < 0} />
      </div>

      <Tabs defaultValue="sales" className="mt-6">
        <TabsList className="no-print"><TabsTrigger value="sales"><Receipt />Sales</TabsTrigger><TabsTrigger value="profit"><TrendingUp />Profit</TabsTrigger><TabsTrigger value="expense"><Wallet />Expense</TabsTrigger><TabsTrigger value="stock"><Package />Stock</TabsTrigger><TabsTrigger value="return"><RotateCcw />Return</TabsTrigger></TabsList>

        <TabsContent value="sales" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
            <Card>
              <CardHeader className="flex-row items-center justify-between"><CardTitle>Daily sales</CardTitle><Toolbar onExport={exportSales} /></CardHeader>
              <CardContent>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chart} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E3E8F0" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748B" }} minTickGap={16} />
                      <YAxis tickLine={false} axisLine={false} width={56} tick={{ fontSize: 11, fill: "#64748B" }} tickFormatter={(v: number) => (Math.abs(v) >= 1000 ? `৳${Math.round(v / 100) / 10}k` : `৳${v}`)} />
                      <Tooltip formatter={(v) => taka(Number(v))} contentStyle={{ borderRadius: 12, border: "1px solid #E3E8F0" }} cursor={{ fill: "rgba(37,99,235,0.06)" }} />
                      <Bar dataKey="sales" name="Sales" fill="#2563EB" radius={[6, 6, 0, 0]} maxBarSize={36} animationDuration={600} />
                      <Bar dataKey="profit" name="Profit" fill="#059669" radius={[6, 6, 0, 0]} maxBarSize={36} animationDuration={600} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Payment breakdown</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {(Object.keys(s.payments) as PaymentMethod[]).map((k) => (
                  <div key={k}>
                    <div className="mb-1 flex justify-between text-sm"><span className="font-semibold">{PAYMENT_LABELS[k]}</span><span className="tabular">{taka(s.payments[k])}</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-gradient-to-r from-royal to-blue" style={{ width: `${s.sales ? (s.payments[k] / s.sales) * 100 : 0}%` }} /></div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <Card className="overflow-hidden"><CardHeader><CardTitle>Day by day</CardTitle></CardHeader><DataTable rows={days} columns={dayCols(false)} rowKey={(d) => d.date} /></Card>
          <Card className="overflow-hidden">
            <CardHeader><CardTitle>Top products</CardTitle></CardHeader>
            <DataTable rows={top.slice(0, 20)} rowKey={(p) => `${p.code}-${p.name}`} empty={{ title: "No products sold in this period" }} columns={[
              { key: "n", header: "Product", cell: (p) => <span className="font-semibold text-navy">{p.name}</span> },
              { key: "c", header: "Code", cell: (p) => <span className="font-mono text-royal">{p.code}</span> },
              { key: "q", header: "Qty", align: "center", cell: (p) => num(p.qty) },
              { key: "r", header: "Revenue", align: "right", cell: (p) => <span className="tabular">{taka(p.revenue)}</span> },
              { key: "p", header: "Profit", align: "right", cell: (p) => <b className="tabular text-emerald-700">{taka(p.profit)}</b> },
            ]} />
          </Card>
        </TabsContent>

        <TabsContent value="profit">
          <Card className="overflow-hidden">
            <CardHeader className="flex-row items-center justify-between"><div><CardTitle>Profit report</CardTitle><p className="mt-1 text-sm text-muted-foreground">Net Profit = Gross Profit − Expenses − Return Adjustments</p></div><Toolbar onExport={exportProfit} /></CardHeader>
            <DataTable rows={days} columns={dayCols(true)} rowKey={(d) => d.date} />
          </Card>
        </TabsContent>

        <TabsContent value="expense" className="grid gap-6 xl:grid-cols-[340px_1fr]">
          <Card>
            <CardHeader><CardTitle>By category</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {expByCat.length === 0 ? <p className="text-sm text-muted-foreground">No expenses.</p> : expByCat.map(([c, v]) => <div key={c} className="flex justify-between text-sm"><span>{EXPENSE_LABELS[c as keyof typeof EXPENSE_LABELS]}</span><b className="tabular">{taka(v)}</b></div>)}
              <div className="flex justify-between border-t pt-2 font-bold"><span>Total</span><span className="tabular">{taka(s.expenses)}</span></div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <CardHeader className="flex-row items-center justify-between"><CardTitle>Expense report</CardTitle><Toolbar onExport={exportExpenses} /></CardHeader>
            <DataTable rows={expenses} rowKey={(e) => e.id} empty={{ title: "No expenses in this period", icon: Wallet }} columns={[
              { key: "d", header: "Date", cell: (e) => formatDate(e.expense_date) },
              { key: "c", header: "Category", cell: (e) => <Badge>{EXPENSE_LABELS[e.category]}</Badge> },
              { key: "n", header: "Note", cell: (e) => <span className="text-muted-foreground">{e.note || "—"}</span> },
              { key: "a", header: "Amount", align: "right", cell: (e) => <b className="tabular">{taka(e.amount)}</b> },
            ]} />
          </Card>
        </TabsContent>

        <TabsContent value="stock" className="space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[["Products", num(active.length)], ["Units in stock", num(active.reduce((a, p) => a + Math.max(p.stock_quantity, 0), 0))], ["Stock value (cost)", taka(stockValue)], ["Retail value", taka(retailValue)]].map(([k, v]) => <Card key={k} className="p-4"><p className="text-xs text-muted-foreground">{k}</p><p className="mt-1 text-xl font-extrabold tabular text-navy">{v}</p></Card>)}
          </div>
          <Card className="overflow-hidden">
            <CardHeader className="flex-row items-center justify-between"><CardTitle>Stock report (current)</CardTitle><Toolbar onExport={exportStock} /></CardHeader>
            <DataTable rows={[...active].sort((a, b) => a.stock_quantity - b.stock_quantity)} rowKey={(p) => p.id} empty={{ title: "No products", icon: Package }} columns={[
              { key: "n", header: "Product", cell: (p) => <span className="font-semibold text-navy">{p.name}</span> },
              { key: "c", header: "Code", cell: (p) => <span className="font-mono text-royal">{p.code}</span> },
              { key: "sz", header: "Size / Color", cell: (p) => [p.size, p.color].filter(Boolean).join(" · ") || "—" },
              { key: "s", header: "Stock", align: "right", cell: (p) => <b className="tabular">{p.stock_quantity}</b> },
              { key: "v", header: "Value", align: "right", cell: (p) => <span className="tabular">{taka(Math.max(p.stock_quantity, 0) * p.cost_price)}</span> },
              { key: "st", header: "Status", cell: (p) => <StockBadge stock={p.stock_quantity} threshold={threshold} /> },
            ]} />
          </Card>
        </TabsContent>

        <TabsContent value="return" className="grid gap-6 xl:grid-cols-[340px_1fr]">
          <Card>
            <CardHeader><CardTitle>By reason</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {retByReason.length === 0 ? <p className="text-sm text-muted-foreground">No returns.</p> : retByReason.map(([r, x]) => <div key={r} className="flex justify-between text-sm"><span>{REASON_LABELS[r as keyof typeof REASON_LABELS]} <span className="text-muted-foreground">({x.n})</span></span><b className="tabular">{taka(x.v)}</b></div>)}
              <div className="flex justify-between border-t pt-2 font-bold"><span>Total refunded</span><span className="tabular">{taka(s.returns)}</span></div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <CardHeader className="flex-row items-center justify-between"><CardTitle>Return report</CardTitle><Toolbar onExport={exportReturns} /></CardHeader>
            <DataTable rows={returns} rowKey={(r) => r.id} empty={{ title: "No returns in this period", icon: RotateCcw }} columns={[
              { key: "no", header: "Return", cell: (r) => <span className="font-mono font-semibold">{r.return_no}</span> },
              { key: "d", header: "Date", cell: (r) => <span className="text-xs">{formatDateTime(r.created_at)}</span> },
              { key: "i", header: "Invoice", cell: (r) => <Link href={`/sales?invoice=${r.invoice_no}`} className="font-mono text-xs text-blue hover:underline">{r.invoice_no}</Link> },
              { key: "r", header: "Reason", cell: (r) => <Badge variant="warning">{REASON_LABELS[r.reason]}</Badge> },
              { key: "q", header: "Items", align: "center", cell: (r) => r.item_count },
              { key: "v", header: "Refund", align: "right", cell: (r) => <b className="tabular">{taka(r.refund_amount)}</b> },
            ]} />
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
