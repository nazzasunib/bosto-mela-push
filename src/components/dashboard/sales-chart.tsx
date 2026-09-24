"use client";
import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from "recharts";
import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { taka } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ChartPoint } from "@/lib/types";

const SERIES = [
  { key: "sales", label: "Sales", color: "#2563EB" },
  { key: "profit", label: "Profit", color: "#059669" },
  { key: "expenses", label: "Expenses", color: "#F59E0B" },
] as const;

function ChartTooltip({ active, payload, label }: TooltipContentProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border bg-card/95 px-3.5 py-2.5 text-sm shadow-lift backdrop-blur">
      <p className="mb-1.5 font-bold text-navy">{label}</p>
      {payload.map((p) => (
        <div key={String(p.dataKey)} className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-2 text-muted-foreground"><span className="size-2 rounded-full" style={{ background: p.color }} />{p.name}</span>
          <span className="font-semibold tabular text-navy">{taka(Number(p.value))}</span>
        </div>
      ))}
    </div>
  );
}

export function SalesChart({ datasets }: { datasets: Record<string, { label: string; points: ChartPoint[] }> }) {
  const keys = Object.keys(datasets);
  const [active, setActive] = useState(keys[0]);
  const [hidden, setHidden] = useState<string[]>([]);
  const data = datasets[active]?.points ?? [];
  const total = data.reduce((s, p) => s + p.sales, 0);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><TrendingUp className="size-4 text-blue" />Sales Overview</CardTitle>
          <CardDescription>{taka(total)} net sales · {datasets[active]?.label}</CardDescription>
        </div>
        <div className="flex gap-1 rounded-xl bg-secondary p-1">
          {keys.map((k) => (
            <button key={k} onClick={() => setActive(k)} className={cn("cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-all", active === k ? "bg-card text-navy shadow-soft" : "text-muted-foreground hover:text-navy")}>{datasets[k].label}</button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex flex-wrap gap-2">
          {SERIES.map((s) => {
            const off = hidden.includes(s.key);
            return (
              <button key={s.key} onClick={() => setHidden((h) => (off ? h.filter((x) => x !== s.key) : [...h, s.key]))} className={cn("flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition", off ? "opacity-40" : "bg-card")}>
                <span className="size-2.5 rounded-full" style={{ background: s.color }} />{s.label}
              </button>
            );
          })}
        </div>
        <div className="h-[280px] w-full sm:h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                {SERIES.map((s) => (
                  <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={s.color} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E3E8F0" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748B" }} minTickGap={24} />
              <YAxis tickLine={false} axisLine={false} width={56} tick={{ fontSize: 11, fill: "#64748B" }} tickFormatter={(v: number) => (Math.abs(v) >= 1000 ? `৳${Math.round(v / 100) / 10}k` : `৳${v}`)} />
              <Tooltip content={(props) => <ChartTooltip {...(props as TooltipContentProps<number, string>)} />} cursor={{ stroke: "#123B6D", strokeDasharray: "4 4", strokeOpacity: 0.3 }} />
              {SERIES.filter((s) => !hidden.includes(s.key)).map((s) => (
                <Area key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2.5} fill={`url(#fill-${s.key})`} dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }} animationDuration={700} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
