import { Skeleton } from "@/components/ui/skeleton";

export function PageSkeleton({ cards = 4, rows = 6 }: { cards?: number; rows?: number }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3"><Skeleton className="size-11" /><div className="space-y-2"><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-72" /></div></div>
      {cards > 0 && <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: cards }).map((_, i) => <Skeleton key={i} className="h-[112px]" />)}</div>}
      <div className="rounded-2xl border bg-card p-5 shadow-soft space-y-3">{Array.from({ length: rows }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
    </div>
  );
}
