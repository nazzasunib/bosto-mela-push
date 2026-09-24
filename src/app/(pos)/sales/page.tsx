import type { Metadata } from "next";
import { Suspense } from "react";
import { SalesHistory } from "@/components/sales/sales-history";
import { listSales } from "@/lib/queries/data";
import { rangeFromParams } from "@/lib/range-params";
import { requireSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Sales History" };
export const dynamic = "force-dynamic";

export default async function SalesPage({ searchParams }: { searchParams: Promise<{ range?: string; from?: string; to?: string }> }) {
  const [user, sp] = await Promise.all([requireSession(), searchParams]);
  const { key, range } = rangeFromParams(sp, "7d");
  const sales = await listSales({ range });
  return <Suspense><SalesHistory sales={sales} rangeKey={key} from={range.from} to={range.to} isAdmin={user.role === "admin"} /></Suspense>;
}
