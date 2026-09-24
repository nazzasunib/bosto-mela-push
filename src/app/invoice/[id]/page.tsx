import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Invoice } from "@/components/invoice/invoice";
import { InvoiceToolbar } from "@/components/invoice/invoice-toolbar";
import { requireSession } from "@/lib/auth";
import { getSale, getSettings, listReturns } from "@/lib/queries/data";
import { shopDate } from "@/lib/dates";

export const metadata: Metadata = { title: "Invoice" };
export const dynamic = "force-dynamic";

export default async function InvoicePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ print?: string; size?: string }> }) {
  await requireSession();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const sale = await getSale(id);
  if (!sale) notFound();
  const [settings, returns] = await Promise.all([getSettings(), listReturns({ from: shopDate(), to: shopDate() }, sale.id)]);
  const size = sp.size === "a4" ? "a4" : "receipt";
  return (
    <div className="min-h-dvh bg-slate-100 py-6 print:bg-white print:py-0">
      <InvoiceToolbar id={sale.id} size={size} autoPrint={sp.print === "1"} />
      <div className="mx-auto w-fit max-w-full rounded-xl bg-white shadow-lift print:rounded-none print:shadow-none"><Invoice sale={sale} settings={settings} returns={returns} size={size} /></div>
    </div>
  );
}
