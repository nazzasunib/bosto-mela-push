"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Boxes, History, PackageX, Search, SlidersHorizontal, Warehouse, Coins } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/common/stat-card";
import { PageHeader } from "@/components/common/page-header";
import { DataTable, type Column } from "@/components/common/data-table";
import { StockBadge } from "@/components/common/status-badge";
import { StockAdjustDialog } from "./stock-adjust-dialog";
import { MovementsTable } from "./movements-table";
import { taka } from "@/lib/format";
import { round2 } from "@/lib/calc";
import { cn } from "@/lib/utils";
import type { Product, StockMovement } from "@/lib/types";

type Filter = "all" | "low" | "out";

export function StockView({ products, movements, threshold, initialFilter }: { products: Product[]; movements: StockMovement[]; threshold: number; initialFilter: Filter }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [adjusting, setAdjusting] = useState<Product | null>(null);
  const active = products.filter((p) => p.status === "active");

  const stats = useMemo(() => ({
    total: active.length, units: active.reduce((s, p) => s + Math.max(p.stock_quantity, 0), 0),
    low: active.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= threshold).length, out: active.filter((p) => p.stock_quantity <= 0).length,
    value: round2(active.reduce((s, p) => s + Math.max(p.stock_quantity, 0) * p.cost_price, 0)),
  }), [active, threshold]);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return active.filter((p) => (filter === "all" || (filter === "out" ? p.stock_quantity <= 0 : p.stock_quantity > 0 && p.stock_quantity <= threshold)) && (!t || `${p.name} ${p.code} ${p.barcode ?? ""}`.toLowerCase().includes(t)))
      .sort((a, b) => (filter === "all" ? 0 : a.stock_quantity - b.stock_quantity));
  }, [active, q, filter, threshold]);

  const columns: Column<Product>[] = [
    { key: "product", header: "Product", hideOnCard: true, cell: (p) => <span className="block max-w-[240px] truncate font-semibold text-navy">{p.name}</span> },
    { key: "code", header: "Code", cell: (p) => <span className="font-mono font-bold text-royal">{p.code}</span> },
    { key: "size", header: "Size", cell: (p) => p.size || "—" },
    { key: "color", header: "Color", cell: (p) => p.color || "—" },
    { key: "stock", header: "Current Stock", align: "right", cell: (p) => <b className={cn("text-base tabular", p.stock_quantity <= 0 ? "text-red-600" : p.stock_quantity <= threshold ? "text-amber-600" : "text-navy")}>{p.stock_quantity}</b> },
    { key: "cost", header: "Cost Price", align: "right", cell: (p) => <span className="tabular text-muted-foreground">{taka(p.cost_price)}</span> },
    { key: "price", header: "Selling Price", align: "right", cell: (p) => <span className="tabular">{taka(p.selling_price)}</span> },
    { key: "value", header: "Stock Value", align: "right", cell: (p) => <span className="font-semibold tabular">{taka(Math.max(p.stock_quantity, 0) * p.cost_price)}</span> },
    { key: "status", header: "Status", cell: (p) => <StockBadge stock={p.stock_quantity} threshold={threshold} /> },
    { key: "act", header: "", align: "right", cell: (p) => <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setAdjusting(p); }}><SlidersHorizontal />Update</Button> },
  ];

  const filters: { k: Filter; label: string; count: number }[] = [{ k: "all", label: "All", count: stats.total }, { k: "low", label: "Low Stock", count: stats.low }, { k: "out", label: "Out of Stock", count: stats.out }];

  return (
    <>
      <PageHeader title="Stock" description="Track inventory levels, add stock and review every movement." icon={Warehouse} />
      <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-5">
        <StatCard index={0} label="Total Products" value={stats.total} icon={Boxes} tone="blue" />
        <StatCard index={1} label="Total Stock" value={stats.units} icon={Warehouse} tone="violet" hint="units in hand" />
        <StatCard index={2} label="Low Stock" value={stats.low} icon={AlertTriangle} tone="amber" hint={`≤ ${threshold} units`} />
        <StatCard index={3} label="Out of Stock" value={stats.out} icon={PackageX} tone="red" />
        <StatCard index={4} label="Stock Value (cost)" value={stats.value} currency icon={Coins} highlight />
      </div>
      <Tabs defaultValue="stock" className="mt-6">
        <TabsList><TabsTrigger value="stock"><Boxes />Stock</TabsTrigger><TabsTrigger value="moves"><History />Movement History</TabsTrigger></TabsList>
        <TabsContent value="stock">
          <Card className="overflow-hidden">
            <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center">
              <div className="relative flex-1"><Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search product, code, barcode…" className="pl-9" /></div>
              <div className="flex gap-1 rounded-xl bg-secondary p-1">
                {filters.map((f) => <button key={f.k} onClick={() => setFilter(f.k)} className={cn("cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition", filter === f.k ? "bg-card text-navy shadow-soft" : "text-muted-foreground hover:text-navy")}>{f.label} <span className="ml-1 opacity-60">{f.count}</span></button>)}
              </div>
            </div>
            <DataTable rows={rows} columns={columns} rowKey={(p) => p.id} onRowClick={setAdjusting} cardTitle={(p) => p.name} empty={{ title: "No products in this view", icon: Boxes }} />
          </Card>
        </TabsContent>
        <TabsContent value="moves"><Card className="overflow-hidden"><MovementsTable rows={movements} /></Card></TabsContent>
      </Tabs>
      <StockAdjustDialog product={adjusting} onClose={(changed) => { setAdjusting(null); if (changed) router.refresh(); }} />
    </>
  );
}
