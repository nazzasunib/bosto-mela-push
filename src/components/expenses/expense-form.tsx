"use client";
import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/common/field";
import { saveExpense } from "@/lib/actions/admin";
import { EXPENSE_LABELS } from "@/lib/format";
import { shopDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { Expense, ExpenseCategory } from "@/lib/types";

export function ExpenseForm({ expense, onSaved, onCancel }: { expense?: Expense | null; onSaved: () => void; onCancel?: () => void }) {
  const [category, setCategory] = useState<ExpenseCategory>(expense?.category ?? "food_tea");
  const [amount, setAmount] = useState(expense ? String(expense.amount) : "");
  const [note, setNote] = useState(expense?.note ?? "");
  const [date, setDate] = useState(expense?.expense_date ?? shopDate());
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(Number(amount) > 0)) { toast.error("Enter an amount greater than 0."); return; }
    setBusy(true);
    const res = await saveExpense({ id: expense?.id, category, amount: Number(amount), note, date });
    setBusy(false);
    if (!res.ok) { toast.error(res.error); return; }
    toast.success(expense ? "Expense updated" : "Expense added");
    if (!expense) { setAmount(""); setNote(""); }
    onSaved();
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      <Field label="Category">
        <div className="grid grid-cols-2 gap-1.5 min-[480px]:grid-cols-5">
          {(Object.keys(EXPENSE_LABELS) as ExpenseCategory[]).map((c) => (
            <button type="button" key={c} onClick={() => setCategory(c)} className={cn("cursor-pointer rounded-xl border-2 px-2 py-2 text-xs font-semibold transition active:scale-95", category === c ? "border-blue bg-accent text-navy" : "border-transparent bg-secondary/70 text-muted-foreground hover:bg-accent")}>{EXPENSE_LABELS[c]}</button>
          ))}
        </div>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Amount (৳)" htmlFor="ex-amount"><Input id="ex-amount" type="number" min={1} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="h-12 text-lg font-bold" required /></Field>
        <Field label="Date" htmlFor="ex-date"><Input id="ex-date" type="date" value={date} max={shopDate()} onChange={(e) => setDate(e.target.value)} className="h-12" required /></Field>
      </div>
      <Field label="Note" htmlFor="ex-note"><Input id="ex-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional details" /></Field>
      <div className="flex justify-end gap-2">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" size="lg" disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <Save />}{expense ? "Save changes" : "Add Expense"}</Button>
      </div>
    </form>
  );
}
