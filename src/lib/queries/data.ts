import "server-only";
import { db, fetchAll, n } from "@/lib/supabase/server";
import { eachDay, rangeBounds, shopDate, type DateRange } from "@/lib/dates";
import { round2 } from "@/lib/calc";
import type { ChartPoint, DailyClosing, Expense, PaymentMethod, PosUser, Product, ReturnWithInvoice, Sale, SaleItem, SaleStatus, SaleWithItems, Settings, StockMovement, Summary } from "@/lib/types";

const PRODUCT_NUM = ["cost_price", "selling_price", "stock_quantity"] as const;
const SALE_NUM = ["subtotal", "item_discount", "order_discount", "discount_total", "total", "cost_total", "gross_profit", "amount_paid", "change_due", "returned_amount", "returned_cost", "item_count"] as const;
const ITEM_NUM = ["quantity", "unit_cost", "unit_price", "discount", "line_total", "net_total", "cost_total", "profit", "returned_qty"] as const;
const RETURN_NUM = ["refund_amount", "cost_amount", "profit_adjustment", "item_count"] as const;
const CLOSING_NUM = ["orders", "items_sold", "total_sales", "total_cost", "gross_profit", "expenses", "returns", "return_adjustment", "net_profit", "cash", "bkash", "nagad", "card", "other"] as const;

type Row = Record<string, unknown>;
function nums<T>(row: Row, keys: readonly string[]): T {
  const out: Row = { ...row };
  for (const k of keys) out[k] = n(row[k]);
  return out as T;
}
const toProduct = (r: Row) => nums<Product>(r, PRODUCT_NUM);
const toSale = (r: Row) => nums<Sale>(r, SALE_NUM);
const toItem = (r: Row) => nums<SaleItem>(r, ITEM_NUM);

// ---------------- SETTINGS / USERS ----------------
export async function getSettings(): Promise<Settings> {
  const { data, error } = await db().from("settings").select("*").eq("id", 1).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Settings | null) ?? { id: 1, shop_name: "Bosto Mela", address: "", phone: "", invoice_footer: "Thank you for shopping with us!", low_stock_threshold: 5, updated_at: new Date().toISOString() };
}

export async function listUsers(includeInactive = true): Promise<PosUser[]> {
  let q = db().from("users").select("id, name, role, active, created_at").order("created_at");
  if (!includeInactive) q = q.eq("active", true);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as PosUser[];
}

// ---------------- PRODUCTS ----------------
export async function listProducts(opts: { activeOnly?: boolean } = {}): Promise<Product[]> {
  const rows = await fetchAll<Row>((from, to) => {
    let q = db().from("products").select("*").order("created_at", { ascending: false }).range(from, to);
    if (opts.activeOnly) q = q.eq("status", "active");
    return q;
  });
  return rows.map(toProduct);
}

export async function getCategories(): Promise<string[]> {
  const rows = await fetchAll<{ category: string }>((from, to) => db().from("products").select("category").range(from, to));
  return [...new Set(rows.map((r) => r.category).filter(Boolean))].sort();
}

// ---------------- STOCK ----------------
export async function listMovements(limit = 300, productId?: string): Promise<StockMovement[]> {
  let q = db().from("stock_movements").select("*, products(name, code), users(name)").order("created_at", { ascending: false }).limit(limit);
  if (productId) q = q.eq("product_id", productId);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return ((data ?? []) as Row[]).map((r) => {
    const p = r.products as { name: string; code: string } | null;
    const u = r.users as { name: string } | null;
    return { ...(r as unknown as StockMovement), quantity: n(r.quantity), balance_after: n(r.balance_after), product_name: p?.name ?? "Deleted product", product_code: p?.code ?? "", user_name: u?.name ?? null };
  });
}

// ---------------- SALES ----------------
export interface SalesFilter { range: DateRange; search?: string; status?: SaleStatus | "all" }

export async function listSales(f: SalesFilter): Promise<Sale[]> {
  const { start, end } = rangeBounds(f.range);
  const rows = await fetchAll<Row>((from, to) => {
    let q = db().from("sales").select("*").gte("created_at", start).lt("created_at", end).order("created_at", { ascending: false }).range(from, to);
    if (f.status && f.status !== "all") q = q.eq("status", f.status);
    if (f.search?.trim()) q = q.or(`invoice_no.ilike.%${f.search.trim().replace(/[%,()]/g, "")}%,customer_phone.ilike.%${f.search.trim().replace(/[%,()]/g, "")}%`);
    return q;
  });
  return rows.map(toSale);
}

async function attachItems(sale: Row): Promise<SaleWithItems> {
  const { data, error } = await db().from("sale_items").select("*").eq("sale_id", sale.id as string).order("id");
  if (error) throw new Error(error.message);
  let user_name: string | null = null;
  if (sale.user_id) {
    const u = await db().from("users").select("name").eq("id", sale.user_id as string).maybeSingle();
    user_name = (u.data as { name: string } | null)?.name ?? null;
  }
  return { ...toSale(sale), sale_items: ((data ?? []) as Row[]).map(toItem), user_name };
}

export async function getSale(id: string): Promise<SaleWithItems | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await db().from("sales").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? attachItems(data as Row) : null;
}

export async function getSaleByInvoice(invoice: string): Promise<SaleWithItems | null> {
  const { data, error } = await db().from("sales").select("*").eq("invoice_no", invoice.trim().toUpperCase()).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? attachItems(data as Row) : null;
}

// ---------------- RETURNS ----------------
export async function listReturns(range: DateRange, saleId?: string): Promise<ReturnWithInvoice[]> {
  const { start, end } = rangeBounds(range);
  const rows = await fetchAll<Row>((from, to) => {
    let q = db().from("returns").select("*, sales(invoice_no)").order("created_at", { ascending: false }).range(from, to);
    q = saleId ? q.eq("sale_id", saleId) : q.gte("created_at", start).lt("created_at", end);
    return q;
  });
  return rows.map((r) => ({ ...nums<ReturnWithInvoice>(r, RETURN_NUM), invoice_no: (r.sales as { invoice_no: string } | null)?.invoice_no ?? "" }));
}

// ---------------- EXPENSES ----------------
export async function listExpenses(range: DateRange): Promise<Expense[]> {
  const rows = await fetchAll<Row>((from, to) => db().from("expenses").select("*").gte("expense_date", range.from).lte("expense_date", range.to).order("expense_date", { ascending: false }).order("created_at", { ascending: false }).range(from, to));
  return rows.map((r) => ({ ...(r as unknown as Expense), amount: n(r.amount) }));
}

// ---------------- SUMMARY / CHART ----------------
const emptyPayments = (): Record<PaymentMethod, number> => ({ cash: 0, bkash: 0, nagad: 0, card: 0, other: 0 });

export function summarize(sales: Sale[], returns: ReturnWithInvoice[], expenses: Expense[]): Summary {
  const valid = sales.filter((s) => s.status !== "cancelled");
  const payments = emptyPayments();
  for (const s of valid) payments[s.payment_method] = round2(payments[s.payment_method] + s.total);
  const gross = round2(valid.reduce((a, s) => a + s.gross_profit, 0));
  const exp = round2(expenses.reduce((a, e) => a + e.amount, 0));
  const retAdj = round2(returns.reduce((a, r) => a + r.profit_adjustment, 0));
  return {
    sales: round2(valid.reduce((a, s) => a + s.total, 0)), orders: valid.length, items: valid.reduce((a, s) => a + s.item_count, 0),
    cost: round2(valid.reduce((a, s) => a + s.cost_total, 0)), grossProfit: gross, expenses: exp,
    returns: round2(returns.reduce((a, r) => a + r.refund_amount, 0)), returnCount: returns.reduce((a, r) => a + r.item_count, 0),
    returnAdjustment: retAdj, netProfit: round2(gross - exp - retAdj), payments,
  };
}

export interface PeriodData { sales: Sale[]; returns: ReturnWithInvoice[]; expenses: Expense[]; summary: Summary }

export async function getPeriod(range: DateRange): Promise<PeriodData> {
  const [sales, returns, expenses] = await Promise.all([listSales({ range }), listReturns(range), listExpenses(range)]);
  return { sales, returns, expenses, summary: summarize(sales, returns, expenses) };
}

export function buildChart(range: DateRange, d: Pick<PeriodData, "sales" | "returns" | "expenses">): ChartPoint[] {
  const map = new Map<string, ChartPoint>();
  const fmt = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" });
  for (const day of eachDay(range)) map.set(day, { date: day, label: fmt.format(new Date(`${day}T00:00:00Z`)), sales: 0, profit: 0, expenses: 0 });
  for (const s of d.sales) {
    if (s.status === "cancelled") continue;
    const p = map.get(shopDate(new Date(s.created_at)));
    if (p) { p.sales = round2(p.sales + s.total); p.profit = round2(p.profit + s.gross_profit); }
  }
  for (const r of d.returns) {
    const p = map.get(shopDate(new Date(r.created_at)));
    if (p) { p.sales = round2(p.sales - r.refund_amount); p.profit = round2(p.profit - r.profit_adjustment); }
  }
  for (const e of d.expenses) {
    const p = map.get(e.expense_date);
    if (p) p.expenses = round2(p.expenses + e.amount);
  }
  return [...map.values()];
}

// ---------------- DAILY CLOSING ----------------
export async function getClosing(date: string): Promise<DailyClosing | null> {
  const { data, error } = await db().from("daily_closing").select("*").eq("closing_date", date).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? nums<DailyClosing>(data as Row, CLOSING_NUM) : null;
}

export async function listClosings(limit = 30): Promise<DailyClosing[]> {
  const { data, error } = await db().from("daily_closing").select("*").order("closing_date", { ascending: false }).limit(limit);
  if (error) throw new Error(error.message);
  return ((data ?? []) as Row[]).map((r) => nums<DailyClosing>(r, CLOSING_NUM));
}

// ---------------- PRODUCT PERFORMANCE ----------------
export interface ProductPerf { code: string; name: string; qty: number; revenue: number; profit: number }

export async function productPerformance(range: DateRange): Promise<ProductPerf[]> {
  const { start, end } = rangeBounds(range);
  const rows = await fetchAll<Row>((from, to) => db().from("sale_items").select("product_code, product_name, size, color, quantity, returned_qty, net_total, cost_total, sales!inner(created_at, status)")
    .gte("sales.created_at", start).lt("sales.created_at", end).neq("sales.status", "cancelled").range(from, to));
  const map = new Map<string, ProductPerf>();
  for (const r of rows) {
    const qty = n(r.quantity); const ret = n(r.returned_qty);
    const keep = qty > 0 ? (qty - ret) / qty : 0;
    const key = `${r.product_code}|${r.product_name}`;
    const p = map.get(key) ?? { code: String(r.product_code), name: String(r.product_name), qty: 0, revenue: 0, profit: 0 };
    p.qty += qty - ret; p.revenue = round2(p.revenue + n(r.net_total) * keep); p.profit = round2(p.profit + (n(r.net_total) - n(r.cost_total)) * keep);
    map.set(key, p);
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue);
}
