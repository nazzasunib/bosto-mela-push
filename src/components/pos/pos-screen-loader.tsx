"use client";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product } from "@/lib/types";

function POSSkeleton() {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
      <div className="space-y-4"><Skeleton className="h-16 rounded-2xl" /><Skeleton className="h-[420px] rounded-2xl" /></div>
      <Skeleton className="hidden h-[560px] rounded-2xl xl:block" />
    </div>
  );
}

// The POS restores the saved cart from browser storage, so it renders on the client only.
const POSScreen = dynamic(() => import("./pos-screen").then((m) => m.POSScreen), { ssr: false, loading: POSSkeleton });

export function POSScreenLoader({ products }: { products: Product[] }) {
  return <POSScreen products={products} />;
}
