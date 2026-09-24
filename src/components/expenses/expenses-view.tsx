"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/common/page-header";
import { RangeFilter } from "@/components/common/range-filter";
import { DataTable, type Column } from "@/components/common/data-table";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ExpenseForm } from "./expense-form";
import { deleteExpense } from "@/lib/actions/admin";
import { EXPENSE_LABELS, formatDate, taka } from "@/lib/format";
import { round2 } from "@/lib/calc";
import type { RangeKey } from "@/lib/dates";
import type { Expense, ExpenseCategory } from "@/lib/types";

export function ExpensesView({ expenses, todayTotal, rangeKey, from, to, isAdmin }: { expenses: Expense[]; todayTotal: number; rangeKey: RangeKey; from: string; to: string; isAdmin: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Expense | null>(null);
  const [toDelete, setToDelete] = useState<Expense | null>(null);
  const total = round2(expenses.reduce((s, e) => s + e.amount, 0));
  const byCat = useMemo(() => {
    const m = new Map<ExpenseCategory, number>();
    for (const e of expenses) m.set(e.category, round2((m.get(e.category) ?? 0) + e.amount));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const columns: Column<Expense>[] = [
    { key: "date", header: "Date", cell: (e) => formatDate(e.expense_date) },
    { key: "cat", header: "Category", cell: (e) => <Badge>{EXPENSE_LABELS[e.category]}</Badge> },
    { key: "note", header: "Note", cell: (e) => <span className="block max-w-[260px] truncate text-muted-foreground">{e.note || "—"}</span> },
    { key: "amount", header: "Amount", align: "right", cell: (e) => <b className="tabular">{taka(e.amount)}</b> },
    { key: "act", header: "", align: "right", hideOnCard: true, cell: (e) => (
      <div className="flex justify-end gap-1">
        <Button size="icon-sm" variant="ghost" onClick={() => setEditing(e)} aria-label="Edit"><Pencil /></Button>
        {isAdmin && <Button size="icon-sm" variant="ghost" className="hover:text-red-600" onClick={() => setToDelete(e)} aria-label="Delete"><Trash2 /></Button>}
      </div>) },
  ];

  return (
    <>
      <PageHeader title="Expenses" description={`Today: ${taka(todayTotal)} · Selected period: ${taka(total)}`} icon={Wallet} actions={<RangeFilter value={rangeKey} from={from} to={to} />} />
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="space-y-6">
          <Card><CardHeader><CardTitle>Add expense</CardTitle></CardHeader><CardContent><ExpenseForm onSaved={() => router.refresh()} /></CardContent></Card>
          <Card>
            <CardHeader><CardTitle>By category</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {byCat.length === 0 ? <p className="text-sm text-muted-foreground">No expenses in this period.</p> : byCat.map(([c, v]) => (
                <div key={c}>
                  <div className="mb-1 flex justify-between text-sm"><span className="font-semibold">{EXPENSE_LABELS[c]}</span><span className="tabular">{taka(v)}</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-gradient-to-r from-royal to-blue transition-all duration-700" style={{ width: `${total ? (v / total) * 100 : 0}%` }} /></div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <Card className="overflow-hidden">
          <CardHeader className="flex-row items-center justify-between"><CardTitle>Expense list</CardTitle><span className="text-sm font-bold tabular text-navy">{taka(total)}</span></CardHeader>
          <DataTable rows={expenses} columns={columns} rowKey={(e) => e.id} cardTitle={(e) => <span className="flex justify-between">{EXPENSE_LABELS[e.category]}<span className="tabular">{taka(e.amount)}</span></span>} empty={{ title: "No expenses recorded", icon: Wallet }} />
        </Card>
      </div>
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Edit expense</DialogTitle></DialogHeader>{editing && <ExpenseForm expense={editing} onSaved={() => { setEditing(null); router.refresh(); }} onCancel={() => setEditing(null)} />}</DialogContent>
      </Dialog>
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} title="Delete this expense?" description={toDelete ? `${EXPENSE_LABELS[toDelete.category]} · ${taka(toDelete.amount)} on ${formatDate(toDelete.expense_date)}` : ""} destructive confirmLabel="Delete"
        onConfirm={async () => { if (!toDelete) return; const res = await deleteExpense(toDelete.id); if (res.ok) { toast.success("Expense deleted"); setToDelete(null); router.refresh(); } else toast.error(res.error); }} />
    </>
  );
}
