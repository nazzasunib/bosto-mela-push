import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS } from "@/lib/format";
import type { SaleStatus } from "@/lib/types";

const VARIANT = { completed: "success", cancelled: "muted", returned: "danger", partially_returned: "warning" } as const;

export function SaleStatusBadge({ status }: { status: SaleStatus }) {
  return <Badge variant={VARIANT[status]}>{STATUS_LABELS[status]}</Badge>;
}

export function StockBadge({ stock, threshold }: { stock: number; threshold: number }) {
  if (stock <= 0) return <Badge variant="danger">Out of Stock</Badge>;
  if (stock <= threshold) return <Badge variant="warning">Low Stock</Badge>;
  return <Badge variant="success">In Stock</Badge>;
}
