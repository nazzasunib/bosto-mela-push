import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "./session";
import type { SessionUser } from "./types";

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

export async function requireSession(): Promise<SessionUser> {
  const s = await getSession();
  if (!s) redirect("/login");
  return s;
}

/** For server actions: throws instead of redirecting. */
export async function actionUser(adminOnly = false): Promise<SessionUser> {
  const s = await getSession();
  if (!s) throw new Error("Your session has expired. Please log in again.");
  if (adminOnly && s.role !== "admin") throw new Error("Only an admin can do this.");
  return s;
}
