"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw, Search, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/common/page-header";
import { DataTable, type Column } from "@/components/common/data-table";
import { EmptyState } from "@/components/common/empty-state";
import { SaleDetail } from "@/components/sales/sale-detail";
import { ReturnModal } from "./return-modal";
import { REASON_LABELS, formatDateTime, taka } from "@/lib/format";
import type { ReturnWithInvoice, SaleWithItems } from "@/lib/types";

export function ReturnsView({ recent, sale, query, notFound }: { recent: ReturnWithInvoice[]; sale: SaleWithItems | null; query: string; notFound: boolean }) {
  const router = useRouter();
  const [invoice, setInvoice] = useState(query);
  const [loading, start] = useTransition();
  const [open, setOpen] = useState(false);
  const lookup = (inv: string) => { const v = inv.trim().toUpperCase(); if (v) start(() => router.push(`/returns?invoice=${encodeURIComponent(v)}`, { scroll: false })); };

  const canReturn = sale && (sale.status === "completed" || sale.status === "partially_returned");
  const columns: Column<ReturnWithInvoice>[] = [
    { key: "no", header: "Return No", cell: (r) => <span className="font-mono font-semibold text-navy">{r.return_no}</span> },
    { key: "date", header: "Date", cell: (r) => <span className="text-xs">{formatDateTime(r.created_at)}</span> },
    { key: "inv", header: "Invoice", cell: (r) => <button className="font-mono text-xs font-semibold text-blue hover:underline cursor-pointer" onClick={() => { setInvoice(r.invoice_no); lookup(r.invoice_no); }}>{r.invoice_no}</button> },
    { key: "reason", header: "Reason", cell: (r) => <Badge variant="warning">{REASON_LABELS[r.reason]}</Badge> },
    { key: "items", header: "Items", align: "center", cell: (r) => r.item_count },
    { key: "refund", header: "Refund", align: "right", cell: (r) => <b className="tabular">{taka(r.refund_amount)}</b> },
    { key: "adj", header: "Profit Adj.", align: "right", cell: (r) => <span className="tabular text-red-600">−{taka(r.profit_adjustment)}</span> },
  ];

  return (
    <>
      <PageHeader title="Returns" description="Find the original sale by invoice number and return items." icon={RotateCcw} />
      <Card>
        <CardContent className="pt-5">
          <form onSubmit={(e) => { e.preventDefault(); lookup(invoice); }} className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1"><Search className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" /><Input value={invoice} onChange={(e) => setInvoice(e.target.value.toUpperCase())} placeholder="Invoice number, e.g. BM-260924-0001" className="h-12 pl-12 font-mono text-base" autoFocus /></div>
            <Button type="submit" size="lg" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : <Search />}Find Sale</Button>
          </form>
          {notFound && !loading && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-600/15">No sale found with invoice <b className="font-mono">{query}</b>. Check the number on the receipt.</p>}
        </CardContent>
      </Card>

      {sale && (
        <Card className="mt-6">
          <CardHeader><CardTitle>Original sale</CardTitle></CardHeader>
          <CardContent>
            <SaleDetail sale={sale} actions={canReturn ? <Button size="sm" variant="destructive" onClick={() => setOpen(true)}><Undo2 />Return items</Button> : undefined} />
            {!canReturn && <p className="mt-3 rounded-xl bg-muted p-3 text-sm text-muted-foreground">{sale.status === "cancelled" ? "This sale was cancelled — nothing can be returned." : "All items from this sale have already been returned."}</p>}
          </CardContent>
        </Card>
      )}
      {sale && <ReturnModal sale={sale} open={open} onOpenChange={setOpen} onDone={(no, refund) => { setOpen(false); toast.success(`Return ${no} saved`, { description: `Refund ${taka(refund)} · stock updated` }); router.refresh(); }} />}

      <Card className="mt-6 overflow-hidden">
        <CardHeader><CardTitle>Recent returns (30 days)</CardTitle></CardHeader>
        {recent.length ? <DataTable rows={recent} columns={columns} rowKey={(r) => r.id} /> : <EmptyState icon={RotateCcw} title="No returns yet" description="Returned items will appear here." />}
      </Card>
    </>
  );
}
