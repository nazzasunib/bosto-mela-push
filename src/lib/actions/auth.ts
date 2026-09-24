"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/supabase/server";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";
import { friendly } from "./helpers";
import type { ActionResult, Role } from "@/lib/types";

// Simple brute-force protection: 5 wrong PINs lock that user for 2 minutes (per server process).
const attempts = new Map<string, { count: number; until: number }>();

export async function login(userId: string, pin: string): Promise<ActionResult> {
  try {
    if (!userId || !pin) return { ok: false, error: "Select a user and enter the PIN." };
    const a = attempts.get(userId);
    if (a && a.until > Date.now()) return { ok: false, error: `Too many wrong PINs. Try again in ${Math.ceil((a.until - Date.now()) / 1000)} seconds.` };
    const { data: valid, error } = await db().rpc("verify_user_pin", { p_user: userId, p_pin: pin });
    if (error) throw error;
    if (!valid) {
      const count = (a && a.until <= Date.now() && a.count >= 5 ? 0 : a?.count ?? 0) + 1;
      attempts.set(userId, { count, until: count >= 5 ? Date.now() + 120_000 : 0 });
      return { ok: false, error: count >= 5 ? "Too many wrong PINs. Locked for 2 minutes." : "Wrong PIN. Please try again." };
    }
    attempts.delete(userId);
    const { data: user, error: e2 } = await db().from("users").select("id, name, role").eq("id", userId).single();
    if (e2) throw e2;
    const u = user as { id: string; name: string; role: Role };
    const store = await cookies();
    store.set(SESSION_COOKIE, createSessionToken(u), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" && process.env.INSECURE_COOKIES !== "true", path: "/", maxAge: SESSION_MAX_AGE });
    return { ok: true, data: null };
  } catch (e) {
    return { ok: false, error: friendly(e) };
  }
}

export async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}
