"use client";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { AnimatedNumber } from "./animated-number";
import { cn } from "@/lib/utils";

const TONES = {
  navy: "bg-navy text-white",
  blue: "bg-blue/10 text-blue",
  green: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-600",
  violet: "bg-violet-50 text-violet-600",
} as const;

export interface StatCardProps { label: string; value: number; currency?: boolean; icon: LucideIcon; tone?: keyof typeof TONES; hint?: string; highlight?: boolean; index?: number; negative?: boolean }

export function StatCard({ label, value, currency, icon: Icon, tone = "blue", hint, highlight, index = 0, negative }: StatCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: index * 0.04, ease: "easeOut" }} whileHover={{ y: -3 }}
      className={cn("group relative overflow-hidden rounded-2xl border p-5 shadow-soft transition-shadow hover:shadow-lift", highlight ? "brand-mesh border-transparent text-white" : "border-border/70 bg-card")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={cn("text-[13px] font-semibold", highlight ? "text-blue-100/80" : "text-muted-foreground")}>{label}</p>
          <p className={cn("mt-2 text-2xl font-extrabold tracking-tight xl:text-[28px]", highlight ? "text-white" : negative ? "text-red-600" : "text-navy")}>
            <AnimatedNumber value={value} currency={currency} />
          </p>
          {hint && <p className={cn("mt-1 text-xs", highlight ? "text-blue-100/70" : "text-muted-foreground")}>{hint}</p>}
        </div>
        <div className={cn("grid size-11 shrink-0 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3", highlight ? "bg-white/10 text-white ring-1 ring-white/15" : TONES[tone])}>
          <Icon className="size-5" />
        </div>
      </div>
      {highlight && <div className="pointer-events-none absolute -right-8 -bottom-10 size-32 rounded-full bg-blue/30 blur-2xl" />}
    </motion.div>
  );
}
