import "server-only";
import { revalidatePath } from "next/cache";
import { errorMessage } from "@/lib/format";
import type { ActionResult } from "@/lib/types";

const FRIENDLY: [RegExp, string][] = [
  [/products_barcode_key/i, "This barcode is already used by another product."],
  [/daily_closing_closing_date_key/i, "This day is already closed."],
  [/fetch failed|ENOTFOUND|ECONNREFUSED/i, "Cannot reach the database. Check your internet connection and Supabase settings."],
  [/violates check constraint/i, "Some values are not valid. Please check the form."],
  [/JWT|Invalid API key/i, "Database key is invalid. Check SUPABASE_SERVICE_ROLE_KEY."],
];

export function friendly(e: unknown): string {
  const msg = errorMessage(e);
  for (const [re, text] of FRIENDLY) if (re.test(msg)) return text;
  return msg;
}

/** Wraps a server action body: catches errors into a friendly message and refreshes cached pages. */
export async function run<T>(fn: () => Promise<T>, revalidate = true): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    if (revalidate) revalidatePath("/", "layout");
    return { ok: true, data };
  } catch (e) {
    const msg = friendly(e);
    if (msg.startsWith("NEXT_REDIRECT")) throw e;
    console.error("[action]", msg);
    return { ok: false, error: msg };
  }
}

export function ensure(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

export const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
export const numVal = (v: unknown) => { const x = typeof v === "number" ? v : Number.parseFloat(String(v ?? "")); return Number.isFinite(x) ? x : NaN; };
