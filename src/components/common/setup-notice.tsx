import { Database } from "lucide-react";
import { Logo } from "./logo";

export function SetupNotice() {
  return (
    <div className="grid min-h-dvh place-items-center bg-background p-6">
      <div className="w-full max-w-xl rounded-2xl border bg-card p-8 shadow-lift">
        <Logo />
        <div className="mt-6 flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-amber-800 ring-1 ring-amber-600/20">
          <Database className="mt-0.5 size-5 shrink-0" />
          <div className="text-sm">
            <p className="font-bold">Database is not connected yet</p>
            <p className="mt-1">Create a <code className="rounded bg-white/70 px-1">.env.local</code> file (copy <code className="rounded bg-white/70 px-1">.env.example</code>) and fill in <b>SUPABASE_URL</b>, <b>SUPABASE_SERVICE_ROLE_KEY</b> and <b>SESSION_SECRET</b>. Then run <code className="rounded bg-white/70 px-1">supabase/schema.sql</code> in the Supabase SQL editor and restart the app.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
