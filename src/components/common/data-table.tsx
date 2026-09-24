"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { EmptyState } from "./empty-state";
import type { LucideIcon } from "lucide-react";

export interface Column<T> {
  key: string; header: string; cell: (row: T) => React.ReactNode;
  className?: string; align?: "left" | "right" | "center";
  /** Hide in the mobile card view */
  hideOnCard?: boolean;
}

interface DataTableProps<T> {
  rows: T[]; columns: Column<T>[]; rowKey: (row: T) => string;
  onRowClick?: (row: T) => void; empty?: { title: string; description?: string; icon?: LucideIcon; action?: React.ReactNode };
  cardTitle?: (row: T) => React.ReactNode; rowClassName?: (row: T) => string | undefined; maxRows?: number; footer?: React.ReactNode;
}

const alignCls = (a?: "left" | "right" | "center") => (a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left");

/** Responsive table: a real table on md+ screens, stacked cards on phones. */
export function DataTable<T>({ rows, columns, rowKey, onRowClick, empty, cardTitle, rowClassName, maxRows = 500, footer }: DataTableProps<T>) {
  if (rows.length === 0) return <EmptyState title={empty?.title ?? "Nothing here yet"} description={empty?.description} icon={empty?.icon} action={empty?.action} />;
  const visible = rows.slice(0, maxRows);
  return (
    <>
      <div className="hidden overflow-x-auto scrollbar-thin md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50/80">
              {columns.map((c) => <th key={c.key} className={cn("px-4 py-3 text-[11px] font-bold tracking-wider whitespace-nowrap text-muted-foreground uppercase", alignCls(c.align), c.className)}>{c.header}</th>)}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, i) => (
              <motion.tr key={rowKey(row)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: Math.min(i, 12) * 0.015 }} onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn("border-b border-border/60 transition-colors last:border-0 hover:bg-accent/40", onRowClick && "cursor-pointer", rowClassName?.(row))}>
                {columns.map((c) => <td key={c.key} className={cn("px-4 py-3 align-middle", alignCls(c.align), c.className)}>{c.cell(row)}</td>)}
              </motion.tr>
            ))}
          </tbody>
          {footer && <tfoot>{footer}</tfoot>}
        </table>
      </div>
      <div className="divide-y md:hidden">
        {visible.map((row) => (
          <div key={rowKey(row)} onClick={onRowClick ? () => onRowClick(row) : undefined} className={cn("p-4 transition-colors active:bg-accent/40", onRowClick && "cursor-pointer", rowClassName?.(row))}>
            {cardTitle && <div className="mb-2 font-semibold text-navy">{cardTitle(row)}</div>}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {columns.filter((c) => !c.hideOnCard).map((c) => (
                <div key={c.key} className="min-w-0">
                  <dt className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{c.header}</dt>
                  <dd className="mt-0.5 truncate">{c.cell(row)}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
      {rows.length > maxRows && <p className="border-t px-4 py-3 text-center text-xs text-muted-foreground">Showing first {maxRows} of {rows.length} rows. Narrow the filter to see more.</p>}
    </>
  );
}
