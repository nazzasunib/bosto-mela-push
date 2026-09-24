import Link from "next/link";
import { CalendarCheck, LayoutDashboard, ShoppingCart } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { AutoRefresh } from "@/components/common/auto-refresh";
import { Button } from "@/components/ui/button";
import { StatGrid } from "@/components/dashboard/stat-grid";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { LowStockList } from "@/components/dashboard/low-stock-list";
import { RecentSales } from "@/components/dashboard/recent-sales";
import { buildChart, getPeriod, getSettings, listProducts } from "@/lib/queries/data";
import { resolveRange } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const today = resolveRange("today");
  const d30 = resolveRange("30d"); const month = resolveRange("month"); const d7 = resolveRange("7d");
  const span = { from: d30.from < month.from ? d30.from : month.from, to: today.to };
  const [todayData, windowData, products, settings] = await Promise.all([getPeriod(today), getPeriod(span), listProducts({ activeOnly: true }), getSettings()]);
  const low = products.filter((p) => p.stock_quantity <= settings.low_stock_threshold).sort((a, b) => a.stock_quantity - b.stock_quantity);
  const datasets = {
    "7d": { label: "Last 7 Days", points: buildChart(d7, windowData) },
    "30d": { label: "Last 30 Days", points: buildChart(d30, windowData) },
    month: { label: "This Month", points: buildChart(month, windowData) },
  };

  return (
    <>
      <AutoRefresh />
      <PageHeader title="Dashboard" description={`Welcome to ${settings.shop_name}. Here is today at a glance.`} icon={LayoutDashboard}
        actions={<><Button asChild variant="outline"><Link href="/reports/closing"><CalendarCheck />Daily Closing</Link></Button><Button asChild variant="blue"><Link href="/sale"><ShoppingCart />New Sale</Link></Button></>} />
      <StatGrid s={todayData.summary} lowStock={low.length} />
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <SalesChart datasets={datasets} />
        <LowStockList products={low} threshold={settings.low_stock_threshold} />
      </div>
      <div className="mt-6"><RecentSales sales={todayData.sales} /></div>
    </>
  );
}
