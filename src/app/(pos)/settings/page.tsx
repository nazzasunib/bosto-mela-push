import type { Metadata } from "next";
import { SettingsView } from "@/components/settings/settings-view";
import { getSettings, listUsers } from "@/lib/queries/data";
import { requireSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [me, settings, users] = await Promise.all([requireSession(), getSettings(), listUsers()]);
  return <SettingsView settings={settings} users={users} me={me} />;
}
