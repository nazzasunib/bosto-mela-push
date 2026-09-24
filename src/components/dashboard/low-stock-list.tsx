import Link from "next/link";
import { AlertTriangle, ArrowRight, PackageCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StockBadge } from "@/components/common/status-badge";
import type { Product } from "@/lib/types";

export function LowStockList({ products, threshold }: { products: Product[]; threshold: number }) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><AlertTriangle className="size-4 text-amber-500" />Low Stock</CardTitle>
        <Link href="/stock?filter=low" className="flex items-center gap-1 text-xs font-semibold text-blue hover:underline">View all<ArrowRight className="size-3" /></Link>
      </CardHeader>
      <CardContent className="flex-1">
        {products.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-8 text-center text-sm text-muted-foreground"><PackageCheck className="mb-2 size-8 text-emerald-500" />All products are well stocked.</div>
        ) : (
          <ul className="divide-y">
            {products.slice(0, 7).map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-navy">{p.name}</p>
                  <p className="text-xs text-muted-foreground"><span className="font-mono">{p.code}</span>{p.size && ` · ${p.size}`}{p.color && ` · ${p.color}`}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2"><span className="text-sm font-bold tabular text-navy">{p.stock_quantity}</span><StockBadge stock={p.stock_quantity} threshold={threshold} /></div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
