import { createHmac, timingSafeEqual } from "node:crypto";
import type { SessionUser } from "./types";

export const SESSION_COOKIE = "bm_session";
export const SESSION_MAX_AGE = 60 * 60 * 14; // 14 hours — one shop day

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error("SESSION_SECRET must be set (at least 16 characters) in .env.local");
  return s;
}

const b64 = (s: string) => Buffer.from(s).toString("base64url");
const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

export function createSessionToken(user: SessionUser): string {
  const payload = b64(JSON.stringify({ ...user, exp: Date.now() + SESSION_MAX_AGE * 1000 }));
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined | null): SessionUser | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  try {
    const expected = Buffer.from(sign(payload));
    const given = Buffer.from(sig);
    if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as SessionUser & { exp: number };
    if (!data.exp || data.exp < Date.now()) return null;
    return { id: data.id, name: data.name, role: data.role };
  } catch {
    return null;
  }
}
