import type { Metadata } from "next";
import { ReturnsView } from "@/components/returns/returns-view";
import { getSaleByInvoice, listReturns } from "@/lib/queries/data";
import { resolveRange } from "@/lib/dates";

export const metadata: Metadata = { title: "Returns" };
export const dynamic = "force-dynamic";

export default async function ReturnsPage({ searchParams }: { searchParams: Promise<{ invoice?: string }> }) {
  const query = ((await searchParams).invoice ?? "").trim().toUpperCase().slice(0, 40);
  const [recent, sale] = await Promise.all([listReturns(resolveRange("30d")), query ? getSaleByInvoice(query) : Promise.resolve(null)]);
  return <ReturnsView key={sale ? `${sale.id}-${sale.returned_amount}` : query} recent={recent} sale={sale} query={query} notFound={!!query && !sale} />;
}
