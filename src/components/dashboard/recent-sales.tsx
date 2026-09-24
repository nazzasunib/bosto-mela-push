import Link from "next/link";
import { ArrowRight, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SaleStatusBadge } from "@/components/common/status-badge";
import { PAYMENT_LABELS, formatDateTime, taka } from "@/lib/format";
import type { Sale } from "@/lib/types";

export function RecentSales({ sales }: { sales: Sale[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><Receipt className="size-4 text-blue" />Recent Sales</CardTitle>
        <Link href="/sales" className="flex items-center gap-1 text-xs font-semibold text-blue hover:underline">History<ArrowRight className="size-3" /></Link>
      </CardHeader>
      <CardContent>
        {sales.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No sales yet today.</p> : (
          <ul className="divide-y">
            {sales.slice(0, 6).map((s) => (
              <li key={s.id}>
                <Link href={`/sales?invoice=${s.invoice_no}`} className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition hover:bg-accent/50">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold text-navy">{s.invoice_no}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(s.created_at)} · {s.item_count} items · {PAYMENT_LABELS[s.payment_method]}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1"><span className="font-bold tabular text-navy">{taka(s.total)}</span><SaleStatusBadge status={s.status} /></div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
