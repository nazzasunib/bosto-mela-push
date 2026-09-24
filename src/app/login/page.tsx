import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { SetupNotice } from "@/components/common/setup-notice";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { listUsers } from "@/lib/queries/data";
import type { PosUser } from "@/lib/types";

export const metadata: Metadata = { title: "Log in" };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (!isSupabaseConfigured() || !process.env.SESSION_SECRET) return <SetupNotice />;
  const { next } = await searchParams;
  let users: PosUser[] = []; let error: string | null = null;
  try { users = await listUsers(false); } catch (e) { error = e instanceof Error ? e.message : "Could not load users"; }
  return <LoginForm users={users.map((u) => ({ id: u.id, name: u.name, role: u.role }))} next={next?.startsWith("/") && !next.startsWith("//") ? next : "/"} loadError={error} />;
}
