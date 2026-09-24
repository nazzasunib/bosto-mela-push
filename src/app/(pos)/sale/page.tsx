import type { Metadata } from "next";
import { Suspense } from "react";
import { POSScreenLoader } from "@/components/pos/pos-screen-loader";
import { listProducts } from "@/lib/queries/data";

export const metadata: Metadata = { title: "New Sale" };
export const dynamic = "force-dynamic";

export default async function SalePage() {
  const products = await listProducts({ activeOnly: true });
  return <Suspense><POSScreenLoader products={products} /></Suspense>;
}
