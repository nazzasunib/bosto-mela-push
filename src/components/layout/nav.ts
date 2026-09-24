import { BarChart3, LayoutDashboard, Package, Receipt, RotateCcw, Settings, ShoppingCart, Warehouse, Wallet, type LucideIcon } from "lucide-react";

export interface NavItem { href: string; label: string; icon: LucideIcon; shortcut?: string }

export const NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sale", label: "New Sale", icon: ShoppingCart, shortcut: "F2" },
  { href: "/products", label: "Products", icon: Package },
  { href: "/stock", label: "Stock", icon: Warehouse },
  { href: "/returns", label: "Returns", icon: RotateCcw },
  { href: "/sales", label: "Sales History", icon: Receipt },
  { href: "/expenses", label: "Expenses", icon: Wallet },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
