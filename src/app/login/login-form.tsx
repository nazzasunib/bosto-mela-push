"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Delete, Loader2, LockKeyhole, ShieldCheck, Store } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/common/logo";
import { Button } from "@/components/ui/button";
import { login } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/types";

export function LoginForm({ users, next, loadError }: { users: SessionUser[]; next: string; loadError: string | null }) {
  const router = useRouter();
  const [userId, setUserId] = useState(users[0]?.id ?? "");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, [userId]);

  const submit = async (value = pin) => {
    if (!userId || value.length < 4 || busy) return;
    setBusy(true);
    const res = await login(userId, value);
    if (res.ok) { toast.success("Welcome back!"); router.replace(next); router.refresh(); return; }
    setBusy(false); setPin(""); setShake((s) => s + 1); toast.error(res.error);
  };
  const press = (d: string) => setPin((p) => (p.length < 8 ? p + d : p));

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden brand-mesh p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Logo light />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="max-w-md text-4xl leading-tight font-extrabold tracking-tight">Fast, simple selling for your clothing store.</h1>
          <p className="mt-4 max-w-md text-blue-100/70">Scan, type <span className="rounded-md bg-white/10 px-1.5 font-mono">BSS*2</span> and sell. Stock, profit, returns and expenses update automatically.</p>
          <div className="mt-8 flex gap-6 text-sm text-blue-100/80">
            <span className="flex items-center gap-2"><ShieldCheck className="size-4" />Secure PIN login</span>
            <span className="flex items-center gap-2"><Store className="size-4" />Made for retail</span>
          </div>
        </motion.div>
        <p className="text-xs text-blue-100/40">© {new Date().getFullYear()} Bosto Mela</p>
        <div className="pointer-events-none absolute -right-24 top-1/3 size-96 rounded-full bg-blue/20 blur-3xl" />
      </div>

      <div className="flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="w-full max-w-sm">
          <div className="mb-8 lg:hidden"><Logo /></div>
          <h2 className="text-2xl font-extrabold tracking-tight text-navy">Log in</h2>
          <p className="mt-1 text-sm text-muted-foreground">Choose your name and enter your PIN.</p>
          {loadError && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-600/20">{loadError}. Did you run supabase/schema.sql?</p>}

          <div className="mt-6 grid grid-cols-2 gap-2">
            {users.map((u) => (
              <button key={u.id} onClick={() => { setUserId(u.id); setPin(""); }} className={cn("cursor-pointer rounded-xl border p-3 text-left transition-all", userId === u.id ? "border-blue bg-accent ring-2 ring-blue/20" : "bg-card hover:border-blue/40")}>
                <span className="block truncate font-semibold text-navy">{u.name}</span>
                <span className="text-xs capitalize text-muted-foreground">{u.role}</span>
              </button>
            ))}
          </div>

          <motion.div key={shake} animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : {}} transition={{ duration: 0.35 }} className="mt-6">
            <label className="relative block">
              <LockKeyhole className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
              <input ref={inputRef} type="password" inputMode="numeric" autoComplete="off" value={pin} maxLength={8} placeholder="Enter PIN"
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} onKeyDown={(e) => e.key === "Enter" && submit()}
                className="h-14 w-full rounded-2xl border border-input bg-card pl-12 text-center text-2xl tracking-[0.6em] shadow-xs outline-none focus:border-blue focus:ring-4 focus:ring-blue/15" aria-label="PIN" />
            </label>
          </motion.div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => <Button key={d} variant="outline" size="lg" className="h-14 text-lg" onClick={() => press(d)}>{d}</Button>)}
            <Button variant="ghost" size="lg" className="h-14" onClick={() => setPin((p) => p.slice(0, -1))} aria-label="Delete"><Delete /></Button>
            <Button variant="outline" size="lg" className="h-14 text-lg" onClick={() => press("0")}>0</Button>
            <Button size="lg" className="h-14" disabled={busy || pin.length < 4 || !userId} onClick={() => submit()}>{busy ? <Loader2 className="animate-spin" /> : "Enter"}</Button>
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">First time? Default admin PIN is <b>1234</b> — change it in Settings.</p>
        </motion.div>
      </div>
    </div>
  );
}
