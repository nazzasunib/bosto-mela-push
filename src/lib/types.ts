export type Role = "admin" | "cashier";
export type PaymentMethod = "cash" | "bkash" | "nagad" | "card" | "other";
export type SaleStatus = "completed" | "cancelled" | "returned" | "partially_returned";
export type ProductStatus = "active" | "inactive";
export type MovementType = "stock_in" | "sale" | "return" | "adjustment";
export type ReturnReason = "size_issue" | "defective" | "wrong_product" | "changed_mind" | "other";
export type ExpenseCategory = "rent" | "electricity" | "internet" | "transport" | "packaging" | "staff_salary" | "food_tea" | "repair" | "delivery" | "other";

export interface PosUser { id: string; name: string; role: Role; active: boolean; created_at: string }
export interface SessionUser { id: string; name: string; role: Role }

export interface Settings { id: number; shop_name: string; address: string; phone: string; invoice_footer: string; low_stock_threshold: number; updated_at: string }

export interface Product {
  id: string; name: string; code: string; category: string; size: string; color: string;
  cost_price: number; selling_price: number; stock_quantity: number; barcode: string | null;
  image_url: string | null; status: ProductStatus; created_at: string; updated_at: string;
}

export interface Sale {
  id: string; invoice_no: string; created_at: string; user_id: string | null;
  subtotal: number; item_discount: number; order_discount: number; discount_total: number; total: number;
  cost_total: number; gross_profit: number; payment_method: PaymentMethod; amount_paid: number; change_due: number;
  status: SaleStatus; returned_amount: number; returned_cost: number; item_count: number;
  customer_name: string | null; customer_phone: string | null; note: string | null; cancelled_at: string | null; cancel_reason: string | null;
}

export interface SaleItem {
  id: string; sale_id: string; product_id: string | null; product_name: string; product_code: string; size: string; color: string;
  quantity: number; unit_cost: number; unit_price: number; discount: number; line_total: number; net_total: number;
  cost_total: number; profit: number; returned_qty: number;
}

export interface SaleWithItems extends Sale { sale_items: SaleItem[]; user_name?: string | null }

export interface ReturnRecord {
  id: string; return_no: string; sale_id: string; created_at: string; user_id: string | null; reason: ReturnReason; note: string | null;
  refund_amount: number; cost_amount: number; profit_adjustment: number; item_count: number;
}
export interface ReturnWithInvoice extends ReturnRecord { invoice_no: string }

export interface Expense { id: string; category: ExpenseCategory; amount: number; note: string | null; expense_date: string; user_id: string | null; created_at: string }

export interface StockMovement {
  id: string; product_id: string; quantity: number; type: MovementType; reference: string | null; note: string | null;
  balance_after: number; user_id: string | null; created_at: string;
  product_name?: string; product_code?: string; user_name?: string | null;
}

export interface DailyClosing {
  id: string; closing_date: string; orders: number; items_sold: number; total_sales: number; total_cost: number; gross_profit: number;
  expenses: number; returns: number; return_adjustment: number; net_profit: number;
  cash: number; bkash: number; nagad: number; card: number; other: number; note: string | null; closed_by: string | null; closed_at: string;
}

export interface CartItem {
  productId: string; name: string; code: string; size: string; color: string;
  costPrice: number; price: number; quantity: number; discount: number; stock: number; imageUrl: string | null;
}

export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: string };

export interface ChartPoint { date: string; label: string; sales: number; profit: number; expenses: number }

export interface Summary {
  sales: number; orders: number; items: number; cost: number; grossProfit: number; expenses: number;
  returns: number; returnCount: number; returnAdjustment: number; netProfit: number;
  payments: Record<PaymentMethod, number>;
}
