"use server";
import { actionUser } from "@/lib/auth";
import { db } from "@/lib/supabase/server";
import { getPeriod } from "@/lib/queries/data";
import { isValidDate, shopDate } from "@/lib/dates";
import { ensure, numVal, run, str } from "./helpers";
import type { ActionResult, ExpenseCategory, Role } from "@/lib/types";

const CATEGORIES: ExpenseCategory[] = ["rent", "electricity", "internet", "transport", "packaging", "staff_salary", "food_tea", "repair", "delivery", "other"];

export interface ExpenseInput { id?: string; category: ExpenseCategory; amount: number; note: string; date: string }

export async function saveExpense(input: ExpenseInput): Promise<ActionResult> {
  return run(async () => {
    const user = await actionUser();
    ensure(CATEGORIES.includes(input.category), "Choose an expense category.");
    const amount = numVal(input.amount);
    ensure(amount > 0, "Amount must be more than 0.");
    ensure(isValidDate(input.date), "Choose a valid date.");
    const row = { category: input.category, amount, note: str(input.note, 300) || null, expense_date: input.date };
    const { error } = input.id ? await db().from("expenses").update(row).eq("id", input.id) : await db().from("expenses").insert({ ...row, user_id: user.id });
    if (error) throw error;
    return null;
  });
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  return run(async () => {
    await actionUser(true);
    const { error } = await db().from("expenses").delete().eq("id", id);
    if (error) throw error;
    return null;
  });
}

export async function closeDay(date: string, note: string): Promise<ActionResult> {
  return run(async () => {
    const user = await actionUser();
    ensure(isValidDate(date), "Choose a valid date.");
    ensure(date <= shopDate(), "You cannot close a future day.");
    const { summary: s } = await getPeriod({ from: date, to: date });
    const { error } = await db().from("daily_closing").insert({
      closing_date: date, orders: s.orders, items_sold: s.items, total_sales: s.sales, total_cost: s.cost, gross_profit: s.grossProfit,
      expenses: s.expenses, returns: s.returns, return_adjustment: s.returnAdjustment, net_profit: s.netProfit,
      cash: s.payments.cash, bkash: s.payments.bkash, nagad: s.payments.nagad, card: s.payments.card, other: s.payments.other,
      note: str(note, 300) || null, closed_by: user.id,
    });
    if (error) throw error;
    return null;
  });
}

export interface SettingsInput { shop_name: string; address: string; phone: string; invoice_footer: string; low_stock_threshold: number }

export async function saveSettings(input: SettingsInput): Promise<ActionResult> {
  return run(async () => {
    await actionUser(true);
    const t = Math.trunc(numVal(input.low_stock_threshold));
    ensure(t >= 0, "Low stock level must be 0 or more.");
    const { error } = await db().from("settings").upsert({ id: 1, shop_name: str(input.shop_name, 80) || "Bosto Mela", address: str(input.address, 200), phone: str(input.phone, 40), invoice_footer: str(input.invoice_footer, 200), low_stock_threshold: t, updated_at: new Date().toISOString() });
    if (error) throw error;
    return null;
  });
}

export async function createUser(input: { name: string; role: Role; pin: string }): Promise<ActionResult> {
  return run(async () => {
    await actionUser(true);
    ensure(str(input.name, 60), "Name is required.");
    ensure(/^\d{4,8}$/.test(input.pin), "PIN must be 4–8 digits.");
    const { error } = await db().rpc("create_pos_user", { p_name: str(input.name, 60), p_role: input.role === "admin" ? "admin" : "cashier", p_pin: input.pin });
    if (error) throw error;
    return null;
  });
}

export async function updateUser(input: { id: string; role?: Role; active?: boolean; pin?: string }): Promise<ActionResult> {
  return run(async () => {
    const me = await actionUser(true);
    if (input.id === me.id) ensure(input.active !== false && input.role !== "cashier", "You cannot deactivate or demote yourself.");
    if (input.pin) {
      ensure(/^\d{4,8}$/.test(input.pin), "PIN must be 4–8 digits.");
      const { error } = await db().rpc("set_user_pin", { p_user: input.id, p_pin: input.pin });
      if (error) throw error;
    }
    const patch: Record<string, unknown> = {};
    if (input.role) patch.role = input.role;
    if (typeof input.active === "boolean") patch.active = input.active;
    if (Object.keys(patch).length) {
      const { error } = await db().from("users").update(patch).eq("id", input.id);
      if (error) throw error;
    }
    return null;
  });
}
