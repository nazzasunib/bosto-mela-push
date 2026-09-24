"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Ban, Loader2, Printer, Receipt, Search, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PageHeader } from "@/components/common/page-header";
import { RangeFilter } from "@/components/common/range-filter";
import { DataTable, type Column } from "@/components/common/data-table";
import { SaleStatusBadge } from "@/components/common/status-badge";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { SaleDetail } from "./sale-detail";
import { openInvoice } from "@/components/pos/sale-success-modal";
import { cancelSale, findSaleByInvoice, loadSale } from "@/lib/actions/pos";
import { PAYMENT_LABELS, STATUS_LABELS, formatDateTime, taka } from "@/lib/format";
import { round2 } from "@/lib/calc";
import type { RangeKey } from "@/lib/dates";
import type { Sale, SaleStatus, SaleWithItems } from "@/lib/types";

const profitOf = (s: Sale) => (s.status === "cancelled" ? 0 : round2(s.gross_profit - (s.returned_amount - s.returned_cost)));

export function SalesHistory({ sales, rangeKey, from, to, isAdmin }: { sales: Sale[]; rangeKey: RangeKey; from: string; to: string; isAdmin: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<SaleStatus | "all">("all");
  const [open, setOpen] = useState<SaleWithItems | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("");

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return sales.filter((s) => (status === "all" || s.status === status) && (!t || `${s.invoice_no} ${s.customer_phone ?? ""} ${s.customer_name ?? ""}`.toLowerCase().includes(t)));
  }, [sales, q, status]);
  const totals = useMemo(() => { const v = rows.filter((r) => r.status !== "cancelled"); return { total: round2(v.reduce((a, s) => a + s.total - s.returned_amount, 0)), profit: round2(v.reduce((a, s) => a + profitOf(s), 0)) }; }, [rows]);

  const openSale = async (s: Sale) => {
    setLoadingId(s.id);
    const res = await loadSale(s.id);
    setLoadingId(null);
    if (res.ok) setOpen(res.data); else toast.error(res.error);
  };

  useEffect(() => {
    const inv = params.get("invoice");
    if (!inv) return;
    void findSaleByInvoice(inv).then((res) => (res.ok ? setOpen(res.data) : toast.error(res.error)));
  }, [params]);

  const columns: Column<Sale>[] = [
    { key: "inv", header: "Invoice", hideOnCard: true, cell: (s) => <span className="inline-flex items-center gap-2 font-mono font-semibold text-navy">{loadingId === s.id && <Loader2 className="size-3 animate-spin" />}{s.invoice_no}</span> },
    { key: "date", header: "Date", cell: (s) => <span className="text-xs whitespace-nowrap">{formatDateTime(s.created_at)}</span> },
    { key: "items", header: "Items", align: "center", cell: (s) => s.item_count },
    { key: "total", header: "Total", align: "right", cell: (s) => <div className="tabular"><b className={s.status === "cancelled" ? "line-through text-muted-foreground" : ""}>{taka(s.total)}</b>{s.returned_amount > 0 && <p className="text-xs text-red-600">−{taka(s.returned_amount)}</p>}</div> },
    { key: "pay", header: "Payment", cell: (s) => PAYMENT_LABELS[s.payment_method] },
    { key: "profit", header: "Profit", align: "right", cell: (s) => <span className="font-semibold tabular text-emerald-700">{taka(profitOf(s))}</span> },
    { key: "status", header: "Status", cell: (s) => <SaleStatusBadge status={s.status} /> },
    { key: "print", header: "", align: "right", hideOnCard: true, cell: (s) => <Button size="icon-sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openInvoice(s.id); }} aria-label="Print invoice"><Printer /></Button> },
  ];

  return (
    <>
      <PageHeader title="Sales History" description={`${rows.length} sales · ${taka(totals.total)} net · ${taka(totals.profit)} profit`} icon={Receipt} actions={<RangeFilter value={rangeKey} from={from} to={to} />} />
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center">
          <div className="relative flex-1"><Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search invoice or customer phone…" className="pl-9" /></div>
          <Select value={status} onValueChange={(v) => setStatus(v as SaleStatus | "all")}><SelectTrigger className="md:w-52"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All statuses</SelectItem>{(Object.keys(STATUS_LABELS) as SaleStatus[]).map((k) => <SelectItem key={k} value={k}>{STATUS_LABELS[k]}</SelectItem>)}</SelectContent></Select>
        </div>
        <DataTable rows={rows} columns={columns} rowKey={(s) => s.id} onRowClick={openSale} cardTitle={(s) => <span className="flex items-center justify-between font-mono">{s.invoice_no}<SaleStatusBadge status={s.status} /></span>}
          empty={{ title: "No sales in this period", description: "Try another date range.", icon: Receipt, action: <Button asChild variant="blue"><Link href="/sale">New Sale</Link></Button> }} />
      </Card>

      <Dialog open={!!open} onOpenChange={(o) => { if (!o) { setOpen(null); if (params.get("invoice")) router.replace("/sales", { scroll: false }); } }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Invoice details</DialogTitle><DialogDescription>Reprint, return items or cancel this sale.</DialogDescription></DialogHeader>
          {open && <SaleDetail sale={open} actions={<>
            {(open.status === "completed" || open.status === "partially_returned") && <Button size="sm" variant="outline" asChild><Link href={`/returns?invoice=${open.invoice_no}`}><Undo2 />Return</Link></Button>}
            {isAdmin && open.status === "completed" && <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setCancelOpen(true)}><Ban />Cancel</Button>}
          </>} />}
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={cancelOpen} onOpenChange={setCancelOpen} title={`Cancel ${open?.invoice_no ?? "sale"}?`} description="Stock will be added back. The sale stays in history with status Cancelled." destructive confirmLabel="Cancel sale"
        onConfirm={async () => { if (!open) return; const res = await cancelSale(open.id, reason); if (res.ok) { toast.success("Sale cancelled"); setCancelOpen(false); setReason(""); const r = await loadSale(open.id); if (r.ok) setOpen(r.data); router.refresh(); } else toast.error(res.error); }}>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional)" />
      </ConfirmDialog>
    </>
  );
}
