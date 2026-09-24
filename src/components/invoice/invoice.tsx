import { PAYMENT_LABELS, STATUS_LABELS, formatDateTime, taka } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ReturnWithInvoice, SaleWithItems, Settings } from "@/lib/types";

/** Print-friendly invoice. `size="receipt"` fits 80mm thermal printers; `"a4"` is a full page. */
export function Invoice({ sale, settings, returns = [], size = "receipt" }: { sale: SaleWithItems; settings: Settings; returns?: ReturnWithInvoice[]; size?: "receipt" | "a4" }) {
  const receipt = size === "receipt";
  return (
    <div className={cn("mx-auto bg-white text-[#111827]", receipt ? "w-[80mm] max-w-full px-3 py-4 text-[12px] leading-snug" : "w-full max-w-[210mm] p-10 text-sm")}>
      <div className="text-center">
        <div className={cn("font-extrabold tracking-tight text-[#0B1F3A]", receipt ? "text-lg" : "text-3xl")}>Bosto Mela PoS</div>
        {settings.shop_name && settings.shop_name !== "Bosto Mela PoS" && <div className="font-semibold">{settings.shop_name}</div>}
        {settings.address && <div className="text-[#4b5563]">{settings.address}</div>}
        {settings.phone && <div className="text-[#4b5563]">Phone: {settings.phone}</div>}
      </div>
      <div className={cn("my-3 border-t border-dashed border-[#9ca3af]", !receipt && "my-6")} />
      <div className={cn("grid gap-x-4 gap-y-0.5", receipt ? "grid-cols-[auto_1fr]" : "grid-cols-[auto_1fr_auto_1fr]")}>
        <span className="text-[#6b7280]">Invoice</span><span className="text-right font-mono font-bold">{sale.invoice_no}</span>
        <span className="text-[#6b7280]">Date</span><span className="text-right">{formatDateTime(sale.created_at)}</span>
        {sale.user_name && <><span className="text-[#6b7280]">Cashier</span><span className="text-right">{sale.user_name}</span></>}
        {sale.customer_phone && <><span className="text-[#6b7280]">Customer</span><span className="text-right">{sale.customer_name ? `${sale.customer_name} · ` : ""}{sale.customer_phone}</span></>}
        {sale.status !== "completed" && <><span className="text-[#6b7280]">Status</span><span className="text-right font-bold uppercase">{STATUS_LABELS[sale.status]}</span></>}
      </div>
      <table className={cn("mt-3 w-full", !receipt && "mt-6")}>
        <thead>
          <tr className="border-y border-[#111827] text-left">
            <th className="py-1 font-semibold">Item</th><th className="py-1 text-center font-semibold">Qty</th><th className="py-1 text-right font-semibold">Price</th>
            {!receipt && <th className="py-1 text-right font-semibold">Discount</th>}<th className="py-1 text-right font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          {sale.sale_items.map((i) => (
            <tr key={i.id} className="border-b border-dotted border-[#d1d5db] align-top">
              <td className="py-1 pr-1">
                <div className="font-semibold">{i.product_name}</div>
                <div className="text-[#6b7280]">{i.product_code}{i.size && ` · ${i.size}`}{i.color && ` · ${i.color}`}{receipt && i.discount > 0 && ` · −${taka(i.discount)}`}{i.returned_qty > 0 && ` · returned ${i.returned_qty}`}</div>
              </td>
              <td className="py-1 text-center">{i.quantity}</td>
              <td className="py-1 text-right">{taka(i.unit_price)}</td>
              {!receipt && <td className="py-1 text-right">{i.discount > 0 ? `−${taka(i.discount)}` : "—"}</td>}
              <td className="py-1 text-right font-semibold">{taka(i.line_total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={cn("mt-2 ml-auto space-y-0.5", receipt ? "w-full" : "w-72")}>
        <div className="flex justify-between"><span>Subtotal</span><span>{taka(sale.subtotal)}</span></div>
        {sale.discount_total > 0 && <div className="flex justify-between"><span>Discount</span><span>−{taka(sale.discount_total)}</span></div>}
        <div className={cn("flex justify-between border-t border-[#111827] pt-1 font-extrabold", receipt ? "text-base" : "text-lg")}><span>Total</span><span>{taka(sale.total)}</span></div>
        <div className="flex justify-between"><span>Paid ({PAYMENT_LABELS[sale.payment_method]})</span><span>{taka(sale.amount_paid)}</span></div>
        <div className="flex justify-between"><span>Change</span><span>{taka(sale.change_due)}</span></div>
        {sale.returned_amount > 0 && <div className="flex justify-between font-semibold"><span>Refunded</span><span>−{taka(sale.returned_amount)}</span></div>}
      </div>
      {returns.length > 0 && (
        <div className="mt-3 text-[#4b5563]">{returns.map((r) => <div key={r.id} className="flex justify-between"><span>Return {r.return_no}</span><span>{taka(r.refund_amount)}</span></div>)}</div>
      )}
      <div className={cn("my-3 border-t border-dashed border-[#9ca3af]", !receipt && "my-6")} />
      <div className="text-center text-[#4b5563]">
        <div className="font-semibold text-[#111827]">{settings.invoice_footer}</div>
        <div className="mt-1 text-[10px]">Powered by Bosto Mela PoS</div>
      </div>
    </div>
  );
}
