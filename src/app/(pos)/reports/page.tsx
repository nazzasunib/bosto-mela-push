import type { Metadata } from "next";
import { Suspense } from "react";
import { ReportsView } from "@/components/reports/reports-view";
import { buildChart, getPeriod, getSettings, listProducts, productPerformance } from "@/lib/queries/data";
import { rangeFromParams } from "@/lib/range-params";

export const metadata: Metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ range?: string; from?: string; to?: string }> }) {
  const { key, range } = rangeFromParams(await searchParams, "today");
  const [period, top, products, settings] = await Promise.all([getPeriod(range), productPerformance(range), listProducts(), getSettings()]);
  return (
    <Suspense>
      <ReportsView rangeKey={key} from={range.from} to={range.to} summary={period.summary} sales={period.sales} returns={period.returns} expenses={period.expenses}
        chart={buildChart(range, period)} top={top} products={products} threshold={settings.low_stock_threshold} />
    </Suspense>
  );
}
