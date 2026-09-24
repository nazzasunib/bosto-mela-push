"use client";
import { ArrowDownLeft, ArrowUpRight, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/common/data-table";
import { MOVEMENT_LABELS, formatDateTime } from "@/lib/format";
import type { StockMovement } from "@/lib/types";

const VARIANT = { stock_in: "success", sale: "default", return: "warning", adjustment: "muted" } as const;

export function MovementsTable({ rows }: { rows: StockMovement[] }) {
  const columns: Column<StockMovement>[] = [
    { key: "date", header: "Date", cell: (m) => <span className="whitespace-nowrap text-xs">{formatDateTime(m.created_at)}</span> },
    { key: "product", header: "Product", cell: (m) => <div className="min-w-0"><p className="max-w-[220px] truncate font-semibold text-navy">{m.product_name}</p><p className="font-mono text-xs text-royal">{m.product_code}</p></div> },
    { key: "type", header: "Type", cell: (m) => <Badge variant={VARIANT[m.type]}>{MOVEMENT_LABELS[m.type]}</Badge> },
    { key: "qty", header: "Quantity", align: "right", cell: (m) => <span className={`inline-flex items-center gap-1 font-bold tabular ${m.quantity > 0 ? "text-emerald-600" : "text-red-600"}`}>{m.quantity > 0 ? <ArrowDownLeft className="size-3.5" /> : <ArrowUpRight className="size-3.5" />}{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</span> },
    { key: "balance", header: "Balance", align: "right", cell: (m) => <span className="tabular">{m.balance_after}</span> },
    { key: "ref", header: "Reference", cell: (m) => <div><p className="font-mono text-xs font-semibold">{m.reference ?? "—"}</p>{m.note && <p className="max-w-[200px] truncate text-xs text-muted-foreground">{m.note}</p>}</div> },
    { key: "user", header: "User", cell: (m) => m.user_name ?? "—" },
  ];
  return <DataTable rows={rows} columns={columns} rowKey={(m) => m.id} empty={{ title: "No stock movements yet", icon: History }} />;
}
