"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ban, CheckCircle2, Filter, MoreHorizontal, Package, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DataTable, type Column } from "@/components/common/data-table";
import { PageHeader } from "@/components/common/page-header";
import { StockBadge } from "@/components/common/status-badge";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ProductForm } from "./product-form";
import { deleteProduct, setProductStatus } from "@/lib/actions/catalog";
import { taka } from "@/lib/format";
import type { Product } from "@/lib/types";

export function ProductsView({ products, categories, threshold, isAdmin }: { products: Product[]; categories: string[]; threshold: number; isAdmin: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [status, setStatus] = useState("active");
  const [editing, setEditing] = useState<Product | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Product | null>(null);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return products.filter((p) => (cat === "all" || p.category === cat) && (status === "all" || p.status === status) && (!t || `${p.name} ${p.code} ${p.barcode ?? ""} ${p.color} ${p.size}`.toLowerCase().includes(t)));
  }, [products, q, cat, status]);

  const toggle = async (p: Product) => {
    const res = await setProductStatus(p.id, p.status === "active" ? "inactive" : "active");
    if (res.ok) { toast.success(p.status === "active" ? "Product deactivated" : "Product activated"); router.refresh(); } else toast.error(res.error);
  };

  const columns: Column<Product>[] = [
    { key: "product", header: "Product", hideOnCard: true, cell: (p) => (
      <div className="flex items-center gap-3">
        <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-secondary text-royal">{p.image_url ? <img src={p.image_url} alt="" className="size-full object-cover" /> : <Package className="size-4" />}</div>
        <div className="min-w-0"><p className="max-w-[240px] truncate font-semibold text-navy">{p.name}</p><p className="text-xs text-muted-foreground">{p.category}</p></div>
      </div>) },
    { key: "code", header: "Code", cell: (p) => <span className="font-mono font-bold text-royal">{p.code}</span> },
    { key: "size", header: "Size", cell: (p) => p.size || "—" },
    { key: "color", header: "Color", cell: (p) => p.color || "—" },
    { key: "cost", header: "Cost", align: "right", cell: (p) => <span className="tabular text-muted-foreground">{taka(p.cost_price)}</span> },
    { key: "price", header: "Price", align: "right", cell: (p) => <span className="font-semibold tabular">{taka(p.selling_price)}</span> },
    { key: "stock", header: "Stock", align: "right", cell: (p) => <span className="inline-flex items-center gap-2"><b className="tabular">{p.stock_quantity}</b><StockBadge stock={p.stock_quantity} threshold={threshold} /></span> },
    { key: "barcode", header: "Barcode", cell: (p) => <span className="font-mono text-xs">{p.barcode || "—"}</span> },
    { key: "status", header: "Status", cell: (p) => <Badge variant={p.status === "active" ? "success" : "muted"}>{p.status === "active" ? "Active" : "Inactive"}</Badge> },
    { key: "actions", header: "", align: "right", hideOnCard: true, cell: (p) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()} aria-label="Actions"><MoreHorizontal /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onSelect={() => { setEditing(p); setFormOpen(true); }}><Pencil />Edit</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => void toggle(p)}>{p.status === "active" ? <><Ban />Deactivate</> : <><CheckCircle2 />Activate</>}</DropdownMenuItem>
          {isAdmin && <><DropdownMenuSeparator /><DropdownMenuItem destructive onSelect={() => setToDelete(p)}><Trash2 />Delete</DropdownMenuItem></>}
        </DropdownMenuContent>
      </DropdownMenu>) },
  ];

  return (
    <>
      <PageHeader title="Products" description={`${products.length} products in catalog`} icon={Package} actions={<Button variant="blue" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus />Add Product</Button>} />
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center">
          <div className="relative flex-1"><Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, code, barcode, color…" className="pl-9" /></div>
          <div className="flex gap-2">
            <Select value={cat} onValueChange={setCat}><SelectTrigger className="w-full md:w-44"><Filter className="size-4 text-muted-foreground" /><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All categories</SelectItem>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
            <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-full md:w-36"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem><SelectItem value="all">All status</SelectItem></SelectContent></Select>
          </div>
        </div>
        <DataTable rows={rows} columns={columns} rowKey={(p) => p.id} onRowClick={(p) => { setEditing(p); setFormOpen(true); }}
          cardTitle={(p) => <span className="flex items-center justify-between gap-2">{p.name}<span className="font-mono text-xs text-royal">{p.code}</span></span>}
          empty={{ title: products.length ? "No products match your filters" : "No products yet", description: products.length ? "Try a different search." : "Add your first product to start selling.", icon: Package, action: !products.length && <Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus />Add Product</Button> }} />
      </Card>
      <ProductForm open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) router.refresh(); }} product={editing} categories={categories} />
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} title={`Delete ${toDelete?.name ?? "product"}?`} destructive confirmLabel="Delete"
        description="Products with sales or stock history are deactivated instead of deleted, so your records stay safe."
        onConfirm={async () => { if (!toDelete) return; const res = await deleteProduct(toDelete.id); if (res.ok) { toast.success(res.data.deactivated ? "Product has history — it was deactivated instead" : "Product deleted"); setToDelete(null); router.refresh(); } else toast.error(res.error); }} />
    </>
  );
}
