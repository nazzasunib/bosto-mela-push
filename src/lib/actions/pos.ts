"use server";
import { actionUser } from "@/lib/auth";
import { db } from "@/lib/supabase/server";
import { getSale, getSaleByInvoice } from "@/lib/queries/data";
import { ensure, numVal, run, str } from "./helpers";
import type { ActionResult, PaymentMethod, ReturnReason, SaleWithItems } from "@/lib/types";

const METHODS: PaymentMethod[] = ["cash", "bkash", "nagad", "card", "other"];
const REASONS: ReturnReason[] = ["size_issue", "defective", "wrong_product", "changed_mind", "other"];

export interface CompleteSaleInput {
  items: { productId: string; quantity: number; discount: number; unitPrice?: number; size?: string }[];
  orderDiscount: number; paymentMethod: PaymentMethod; amountPaid: number;
  customerName?: string; customerPhone?: string; note?: string; clientRef?: string;
}

export async function completeSale(input: CompleteSaleInput): Promise<ActionResult<SaleWithItems>> {
  return run(async () => {
    const user = await actionUser();
    ensure(Array.isArray(input.items) && input.items.length > 0, "Cart is empty.");
    ensure(METHODS.includes(input.paymentMethod), "Choose a payment method.");
    const items = input.items.map((i) => ({
      product_id: i.productId,
      quantity: Math.trunc(numVal(i.quantity)),
      discount: Math.max(numVal(i.discount) || 0, 0),
      unit_price: Math.max(numVal(i.unitPrice ?? 0) || 0, 0),
      size: str(i.size, 30),
    }));
    ensure(items.every((i) => i.quantity > 0), "Every item needs a quantity of at least 1.");
    const { data, error } = await db().rpc("complete_sale", {
      p_items: items, p_order_discount: Math.max(numVal(input.orderDiscount) || 0, 0), p_payment_method: input.paymentMethod,
      p_amount_paid: numVal(input.amountPaid) || 0, p_user: user.id, p_customer_name: str(input.customerName, 100) || null,
      p_customer_phone: str(input.customerPhone, 30) || null, p_note: str(input.note, 300) || null,
      p_client_ref: input.clientRef && /^[0-9a-f-]{36}$/i.test(input.clientRef) ? input.clientRef : null,
    });
    if (error) throw error;
    const sale = await getSale((data as { id: string }).id);
    ensure(sale, "Sale saved, but could not be loaded. Check Sales History.");
    return sale;
  });
}

export async function cancelSale(saleId: string, reason: string): Promise<ActionResult> {
  return run(async () => {
    const user = await actionUser(true);
    const { error } = await db().rpc("cancel_sale", { p_sale_id: saleId, p_reason: str(reason, 300) || null, p_user: user.id });
    if (error) throw error;
    return null;
  });
}

export async function findSaleByInvoice(invoice: string): Promise<ActionResult<SaleWithItems>> {
  return run(async () => {
    await actionUser();
    const inv = str(invoice, 40);
    ensure(inv, "Enter an invoice number.");
    const sale = await getSaleByInvoice(inv);
    ensure(sale, `No sale found with invoice ${inv.toUpperCase()}.`);
    return sale;
  }, false);
}

export async function loadSale(id: string): Promise<ActionResult<SaleWithItems>> {
  return run(async () => {
    await actionUser();
    const sale = await getSale(id);
    ensure(sale, "Sale not found.");
    return sale;
  }, false);
}

export async function processReturn(input: { saleId: string; items: { saleItemId: string; quantity: number }[]; reason: ReturnReason; note?: string }): Promise<ActionResult<{ return_no: string; refund_amount: number }>> {
  return run(async () => {
    const user = await actionUser();
    ensure(REASONS.includes(input.reason), "Choose a return reason.");
    const items = input.items.map((i) => ({ sale_item_id: i.saleItemId, quantity: Math.trunc(numVal(i.quantity)) })).filter((i) => i.quantity > 0);
    ensure(items.length > 0, "Select at least one item to return.");
    const { data, error } = await db().rpc("process_return", { p_sale_id: input.saleId, p_items: items, p_reason: input.reason, p_note: str(input.note, 300) || null, p_user: user.id });
    if (error) throw error;
    const r = data as { return_no: string; refund_amount: number | string };
    return { return_no: r.return_no, refund_amount: Number(r.refund_amount) };
  });
}
