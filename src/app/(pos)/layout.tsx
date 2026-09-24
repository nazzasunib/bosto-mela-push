import { AppShell } from "@/components/layout/app-shell";
import { SetupNotice } from "@/components/common/setup-notice";
import { requireSession } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default async function PosLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSession();
  if (!isSupabaseConfigured()) return <SetupNotice />;
  return <AppShell user={user}>{children}</AppShell>;
}
