"use client";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SaleStatusBadge } from "@/components/common/status-badge";
import { openInvoice } from "@/components/pos/sale-success-modal";
import { PAYMENT_LABELS, formatDateTime, taka } from "@/lib/format";
import type { SaleWithItems } from "@/lib/types";

/** Compact read-only view of a sale with its items. */
export function SaleDetail({ sale, actions }: { sale: SaleWithItems; actions?: React.ReactNode }) {
  const net = sale.total - sale.returned_amount;
  const profit = sale.status === "cancelled" ? 0 : sale.gross_profit - (sale.returned_amount - sale.returned_cost);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-lg font-extrabold text-navy">{sale.invoice_no}</p>
          <p className="text-sm text-muted-foreground">{formatDateTime(sale.created_at)} · {PAYMENT_LABELS[sale.payment_method]}{sale.user_name && ` · ${sale.user_name}`}{sale.customer_phone && ` · ${sale.customer_phone}`}</p>
        </div>
        <div className="flex items-center gap-2"><SaleStatusBadge status={sale.status} /><Button size="sm" variant="outline" onClick={() => openInvoice(sale.id)}><Printer />Print</Button>{actions}</div>
      </div>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-[11px] font-bold tracking-wider text-muted-foreground uppercase"><tr><th className="px-3 py-2 text-left">Product</th><th className="px-3 py-2 text-center">Qty</th><th className="px-3 py-2 text-right">Price</th><th className="px-3 py-2 text-right">Discount</th><th className="px-3 py-2 text-right">Total</th><th className="px-3 py-2 text-center">Returned</th></tr></thead>
          <tbody>
            {sale.sale_items.map((i) => (
              <tr key={i.id} className="border-t">
                <td className="px-3 py-2"><p className="font-semibold text-navy">{i.product_name}</p><p className="text-xs text-muted-foreground"><span className="font-mono">{i.product_code}</span>{i.size && ` · ${i.size}`}{i.color && ` · ${i.color}`}</p></td>
                <td className="px-3 py-2 text-center tabular">{i.quantity}</td>
                <td className="px-3 py-2 text-right tabular">{taka(i.unit_price)}</td>
                <td className="px-3 py-2 text-right tabular text-muted-foreground">{i.discount ? taka(i.discount) : "—"}</td>
                <td className="px-3 py-2 text-right font-semibold tabular">{taka(i.line_total)}</td>
                <td className="px-3 py-2 text-center tabular">{i.returned_qty || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[["Total", taka(sale.total)], ["Discount", taka(sale.discount_total)], ["Refunded", taka(sale.returned_amount)], ["Net / Profit", `${taka(sale.status === "cancelled" ? 0 : net)} / ${taka(profit)}`]].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-secondary/70 p-3"><p className="text-xs text-muted-foreground">{k}</p><p className="font-bold tabular text-navy">{v}</p></div>
        ))}
      </div>
    </div>
  );
}
