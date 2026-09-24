import type { Metadata } from "next";
import { Suspense } from "react";
import { ExpensesView } from "@/components/expenses/expenses-view";
import { listExpenses } from "@/lib/queries/data";
import { rangeFromParams } from "@/lib/range-params";
import { resolveRange } from "@/lib/dates";
import { requireSession } from "@/lib/auth";
import { round2 } from "@/lib/calc";

export const metadata: Metadata = { title: "Expenses" };
export const dynamic = "force-dynamic";

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ range?: string; from?: string; to?: string }> }) {
  const [user, sp] = await Promise.all([requireSession(), searchParams]);
  const { key, range } = rangeFromParams(sp, "month");
  const [expenses, today] = await Promise.all([listExpenses(range), listExpenses(resolveRange("today"))]);
  return <Suspense><ExpensesView expenses={expenses} todayTotal={round2(today.reduce((s, e) => s + e.amount, 0))} rangeKey={key} from={range.from} to={range.to} isAdmin={user.role === "admin"} /></Suspense>;
}
