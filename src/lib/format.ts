import { SHOP_TZ } from "./dates";

const money = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 0 });
const int = new Intl.NumberFormat("en-IN");

export const taka = (n: number | null | undefined) => `৳${money.format(Number(n ?? 0))}`;
export const num = (n: number | null | undefined) => int.format(Number(n ?? 0));

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: SHOP_TZ, day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }).format(new Date(iso));
}
export function formatDate(iso: string) {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00+06:00`) : new Date(iso);
  return new Intl.DateTimeFormat("en-GB", { timeZone: SHOP_TZ, day: "2-digit", month: "short", year: "numeric" }).format(d);
}

export const PAYMENT_LABELS = { cash: "Cash", bkash: "bKash", nagad: "Nagad", card: "Card", other: "Other" } as const;
export const STATUS_LABELS = { completed: "Completed", cancelled: "Cancelled", returned: "Returned", partially_returned: "Partially Returned" } as const;
export const REASON_LABELS = { size_issue: "Size Issue", defective: "Defective", wrong_product: "Wrong Product", changed_mind: "Customer Changed Mind", other: "Other" } as const;
export const MOVEMENT_LABELS = { stock_in: "Stock In", sale: "Sale", return: "Return", adjustment: "Adjustment" } as const;
export const EXPENSE_LABELS = { rent: "Rent", electricity: "Electricity", internet: "Internet", transport: "Transport", packaging: "Packaging", staff_salary: "Staff Salary", food_tea: "Food/Tea", repair: "Repair", delivery: "Delivery", other: "Other" } as const;

export function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "object" && e && "message" in e && typeof (e as { message: unknown }).message === "string") return (e as { message: string }).message;
  return "Something went wrong. Please try again.";
}

export const SIZE_OPTIONS = ["S", "M", "L", "XL", "XXL", "3XL"] as const;
/** "M, L,xl" → ["M","L","XL"] — products store their available sizes as one comma separated string. */
export const parseSizes = (s: string | null | undefined) => [...new Set((s ?? "").split(",").map((x) => x.trim().toUpperCase()).filter(Boolean))];
export const joinSizes = (sizes: string[]) => {
  const order = (x: string) => { const i = (SIZE_OPTIONS as readonly string[]).indexOf(x); return i < 0 ? 99 : i; };
  return [...sizes].sort((a, b) => order(a) - order(b)).join(",");
};
