"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { CalendarRange, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RANGE_LABELS, type RangeKey } from "@/lib/dates";
import { cn } from "@/lib/utils";

/** URL-driven date range picker (?range=7d or ?range=custom&from=..&to=..). */
export function RangeFilter({ value, from, to, options = ["today", "yesterday", "7d", "30d", "month", "custom"] }: { value: RangeKey; from: string; to: string; options?: RangeKey[] }) {
  const router = useRouter(); const pathname = usePathname(); const params = useSearchParams();
  const [pending, start] = useTransition();
  const [f, setF] = useState(from); const [t, setT] = useState(to);

  const go = (key: RangeKey, extra: Record<string, string> = {}) => {
    const p = new URLSearchParams(params.toString());
    p.set("range", key); p.delete("from"); p.delete("to");
    Object.entries(extra).forEach(([k, v]) => p.set(k, v));
    start(() => router.push(`${pathname}?${p.toString()}`, { scroll: false }));
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap gap-1 rounded-xl bg-card p-1 shadow-soft ring-1 ring-border">
        {options.map((k) => (
          <button key={k} onClick={() => (k === "custom" ? go("custom", { from: f, to: t }) : go(k))}
            className={cn("rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer", value === k ? "bg-navy text-white shadow-soft" : "text-muted-foreground hover:bg-accent hover:text-navy")}>
            {RANGE_LABELS[k]}
          </button>
        ))}
      </div>
      {value === "custom" && (
        <div className="flex items-center gap-2">
          <Input type="date" value={f} onChange={(e) => setF(e.target.value)} className="h-9 w-[150px]" aria-label="From date" />
          <span className="text-xs text-muted-foreground">to</span>
          <Input type="date" value={t} onChange={(e) => setT(e.target.value)} className="h-9 w-[150px]" aria-label="To date" />
          <Button size="sm" variant="outline" onClick={() => go("custom", { from: f, to: t })}><CalendarRange />Apply</Button>
        </div>
      )}
      {pending && <Loader2 className="size-4 animate-spin text-blue" />}
    </div>
  );
}
