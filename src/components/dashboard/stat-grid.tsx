"use client";
import { AlertTriangle, Banknote, PackageOpen, RotateCcw, ShoppingBag, TrendingUp, Wallet, Coins } from "lucide-react";
import { StatCard } from "@/components/common/stat-card";
import type { Summary } from "@/lib/types";

export function StatGrid({ s, lowStock }: { s: Summary; lowStock: number }) {
  const cards = [
    { label: "Today's Sales", value: s.sales, currency: true, icon: Banknote, highlight: true, hint: `${s.orders} orders today` },
    { label: "Today's Orders", value: s.orders, icon: ShoppingBag, tone: "blue" as const },
    { label: "Items Sold", value: s.items, icon: PackageOpen, tone: "violet" as const },
    { label: "Gross Profit", value: s.grossProfit, currency: true, icon: TrendingUp, tone: "green" as const, hint: `Cost ${Math.round(s.cost).toLocaleString("en-IN")}` },
    { label: "Today's Expenses", value: s.expenses, currency: true, icon: Wallet, tone: "amber" as const },
    { label: "Net Profit", value: s.netProfit, currency: true, icon: Coins, tone: "green" as const, negative: s.netProfit < 0, hint: "Gross − expenses − returns" },
    { label: "Product Returns", value: s.returnCount, icon: RotateCcw, tone: "red" as const, hint: `Refunded ৳${Math.round(s.returns).toLocaleString("en-IN")}` },
    { label: "Low Stock Products", value: lowStock, icon: AlertTriangle, tone: "amber" as const },
  ];
  return <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4">{cards.map((c, i) => <StatCard key={c.label} index={i} {...c} />)}</div>;
}
