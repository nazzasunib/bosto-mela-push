"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Keyboard, KeyRound, Loader2, Save, Settings as SettingsIcon, ShieldCheck, Store, UserPlus, Users, Hash } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/common/page-header";
import { Field } from "@/components/common/field";
import { createUser, saveSettings, updateUser } from "@/lib/actions/admin";
import { CODE_MAP } from "@/lib/code-parser";
import type { PosUser, Role, SessionUser, Settings } from "@/lib/types";

const SHORTCUTS = [["Enter", "Add product from search"], ["CODE*3", "Add 3 of a product"], ["Ctrl / ⌘ + K", "Focus product search"], ["Ctrl / ⌘ + Enter", "Complete sale"], ["F2", "Open New Sale"], ["F4", "Jump to amount paid"], ["↑ / ↓", "Move in search results"], ["Esc", "Close dialog / clear search"]];

export function SettingsView({ settings, users, me }: { settings: Settings; users: PosUser[]; me: SessionUser }) {
  const router = useRouter();
  const isAdmin = me.role === "admin";
  const [s, setS] = useState({ shop_name: settings.shop_name, address: settings.address, phone: settings.phone, invoice_footer: settings.invoice_footer, low_stock_threshold: settings.low_stock_threshold });
  const [saving, setSaving] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", role: "cashier" as Role, pin: "" });
  const [adding, setAdding] = useState(false);
  const [pinFor, setPinFor] = useState<PosUser | null>(null);
  const [pin, setPin] = useState("");

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const res = await saveSettings(s); setSaving(false);
    if (res.ok) { toast.success("Settings saved"); router.refresh(); } else toast.error(res.error);
  };
  const add = async (e: React.FormEvent) => {
    e.preventDefault(); setAdding(true);
    const res = await createUser(newUser); setAdding(false);
    if (res.ok) { toast.success(`${newUser.name} added`); setNewUser({ name: "", role: "cashier", pin: "" }); router.refresh(); } else toast.error(res.error);
  };
  const patchUser = async (input: Parameters<typeof updateUser>[0], msg: string) => {
    const res = await updateUser(input);
    if (res.ok) { toast.success(msg); router.refresh(); return true; }
    toast.error(res.error); return false;
  };

  return (
    <>
      <PageHeader title="Settings" description="Shop details, users and quick reference." icon={SettingsIcon} />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Store className="size-4 text-blue" />Shop & invoice</CardTitle><CardDescription>{isAdmin ? "Shown on printed invoices." : "Only an admin can change these."}</CardDescription></CardHeader>
          <CardContent>
            <form onSubmit={save} className="grid gap-4">
              <fieldset disabled={!isAdmin} className="grid gap-4 sm:grid-cols-2">
                <Field label="Shop name" htmlFor="s-name"><Input id="s-name" value={s.shop_name} onChange={(e) => setS({ ...s, shop_name: e.target.value })} /></Field>
                <Field label="Phone" htmlFor="s-phone"><Input id="s-phone" value={s.phone} onChange={(e) => setS({ ...s, phone: e.target.value })} /></Field>
                <Field label="Address" htmlFor="s-addr" className="sm:col-span-2"><Input id="s-addr" value={s.address} onChange={(e) => setS({ ...s, address: e.target.value })} /></Field>
                <Field label="Invoice footer" htmlFor="s-foot" className="sm:col-span-2"><Input id="s-foot" value={s.invoice_footer} onChange={(e) => setS({ ...s, invoice_footer: e.target.value })} /></Field>
                <Field label="Low stock alert at (units)" htmlFor="s-low"><Input id="s-low" type="number" min={0} value={s.low_stock_threshold} onChange={(e) => setS({ ...s, low_stock_threshold: Number(e.target.value) })} /></Field>
              </fieldset>
              {isAdmin && <div className="flex justify-end"><Button type="submit" disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : <Save />}Save settings</Button></div>}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="size-4 text-blue" />Users</CardTitle><CardDescription>Each user logs in with their own PIN. Stock movements record who did them.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <ul className="divide-y rounded-xl border">
              {users.map((u) => (
                <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-xl bg-navy text-sm font-bold text-white">{u.name.slice(0, 1).toUpperCase()}</span>
                    <div><p className="font-semibold text-navy">{u.name}{u.id === me.id && <span className="ml-1 text-xs text-muted-foreground">(you)</span>}</p><div className="flex gap-1"><Badge variant={u.role === "admin" ? "navy" : "default"}>{u.role}</Badge>{!u.active && <Badge variant="muted">inactive</Badge>}</div></div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => { setPinFor(u); setPin(""); }}><KeyRound />PIN</Button>
                      {u.id !== me.id && <Button size="sm" variant="ghost" onClick={() => void patchUser({ id: u.id, role: u.role === "admin" ? "cashier" : "admin" }, "Role updated")}><ShieldCheck />{u.role === "admin" ? "Make cashier" : "Make admin"}</Button>}
                      {u.id !== me.id && <Button size="sm" variant="ghost" className={u.active ? "text-red-600" : "text-emerald-700"} onClick={() => void patchUser({ id: u.id, active: !u.active }, u.active ? "User deactivated" : "User activated")}>{u.active ? "Deactivate" : "Activate"}</Button>}
                    </div>
                  )}
                </li>
              ))}
            </ul>
            {isAdmin && (
              <form onSubmit={add} className="grid gap-3 rounded-xl bg-secondary/60 p-4 sm:grid-cols-[1fr_130px_110px_auto] sm:items-end">
                <Field label="Name" htmlFor="u-name"><Input id="u-name" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} placeholder="Cashier name" required /></Field>
                <Field label="Role"><Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v as Role })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cashier">Cashier</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent></Select></Field>
                <Field label="PIN" htmlFor="u-pin"><Input id="u-pin" inputMode="numeric" value={newUser.pin} onChange={(e) => setNewUser({ ...newUser, pin: e.target.value.replace(/\D/g, "").slice(0, 8) })} placeholder="4–8 digits" required /></Field>
                <Button type="submit" disabled={adding}>{adding ? <Loader2 className="animate-spin" /> : <UserPlus />}Add</Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Hash className="size-4 text-blue" />Product code system</CardTitle><CardDescription>Cost price is read from the product code letters.</CardDescription></CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2">{Object.entries(CODE_MAP).map(([l, d]) => <div key={l} className="rounded-xl border bg-secondary/40 py-2 text-center"><p className="font-mono text-lg font-extrabold text-navy">{l}</p><p className="text-xs font-semibold text-muted-foreground">= {d}</p></div>)}</div>
            <p className="mt-4 text-sm text-muted-foreground">Examples: <b className="font-mono">BSS</b> = ৳100 · <b className="font-mono">RBS</b> = ৳210 · <b className="font-mono">HTS</b> = ৳560 · <b className="font-mono">YAB</b> = ৳981</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Keyboard className="size-4 text-blue" />Keyboard shortcuts</CardTitle></CardHeader>
          <CardContent><ul className="grid gap-2 sm:grid-cols-2">{SHORTCUTS.map(([k, v]) => <li key={k} className="flex items-center justify-between gap-2 rounded-xl bg-secondary/50 px-3 py-2 text-sm"><span>{v}</span><kbd className="rounded-md border bg-card px-2 py-0.5 font-mono text-xs font-bold">{k}</kbd></li>)}</ul></CardContent>
        </Card>
      </div>

      <Dialog open={!!pinFor} onOpenChange={(o) => !o && setPinFor(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>New PIN for {pinFor?.name}</DialogTitle></DialogHeader>
          <Input inputMode="numeric" autoFocus value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="4–8 digits" className="h-12 text-center text-xl tracking-[0.4em]" />
          <DialogFooter><Button variant="outline" onClick={() => setPinFor(null)}>Cancel</Button><Button disabled={pin.length < 4} onClick={async () => { if (pinFor && (await patchUser({ id: pinFor.id, pin }, "PIN changed"))) setPinFor(null); }}>Save PIN</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
