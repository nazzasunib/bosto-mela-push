import type { Metadata } from "next";
import { StockView } from "@/components/stock/stock-view";
import { getSettings, listMovements, listProducts } from "@/lib/queries/data";

export const metadata: Metadata = { title: "Stock" };
export const dynamic = "force-dynamic";

export default async function StockPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const [{ filter }, products, movements, settings] = await Promise.all([searchParams, listProducts(), listMovements(300), getSettings()]);
  const f = filter === "low" || filter === "out" ? filter : "all";
  return <StockView products={products} movements={movements} threshold={settings.low_stock_threshold} initialFilter={f} />;
}
