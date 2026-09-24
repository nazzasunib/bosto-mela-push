"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { Clock, LogOut, Menu, Search, ShoppingCart, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogoMark } from "@/components/common/logo";
import { logout } from "@/lib/actions/auth";
import { SHOP_TZ } from "@/lib/dates";
import { NAV, isActive } from "./nav";
import type { SessionUser } from "@/lib/types";

const clockSubscribe = (cb: () => void) => { const t = setInterval(cb, 15_000); return () => clearInterval(t); };
const clockSnapshot = () => Math.floor(Date.now() / 60_000);

function LiveClock() {
  const minute = useSyncExternalStore(clockSubscribe, clockSnapshot, () => 0);
  if (!minute) return <span className="h-4 w-40" />;
  return <span className="tabular">{new Intl.DateTimeFormat("en-GB", { timeZone: SHOP_TZ, weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true }).format(new Date(minute * 60_000))}</span>;
}

export function Topbar({ user, onMenu }: { user: SessionUser; onMenu: () => void }) {
  const pathname = usePathname();
  const current = NAV.find((n) => isActive(pathname, n.href));
  return (
    <header className="no-print sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/70 bg-background/80 px-4 backdrop-blur-xl sm:px-6 lg:h-[72px]">
      <button onClick={onMenu} className="rounded-xl p-2 text-navy hover:bg-accent lg:hidden cursor-pointer" aria-label="Open menu"><Menu className="size-5" /></button>
      <div className="lg:hidden"><LogoMark className="size-9" /></div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-navy lg:text-base">{current?.label ?? "Bosto Mela PoS"}</p>
        <p className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex"><Clock className="size-3" /><LiveClock /></p>
      </div>
      <button onClick={() => window.dispatchEvent(new CustomEvent("bm:search"))} className="hidden h-10 w-64 cursor-pointer items-center gap-2 rounded-xl border border-input bg-card px-3 text-sm text-muted-foreground shadow-xs transition hover:border-blue/40 md:flex">
        <Search className="size-4" /><span className="flex-1 text-left">Search product…</span><kbd className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold">Ctrl K</kbd>
      </button>
      {pathname !== "/sale" && <Button asChild variant="blue" className="hidden sm:inline-flex"><Link href="/sale"><ShoppingCart />New Sale</Link></Button>}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex cursor-pointer items-center gap-2 rounded-xl p-1 pr-2 transition hover:bg-accent outline-none">
            <span className="grid size-9 place-items-center rounded-xl bg-navy text-sm font-bold text-white">{user.name.slice(0, 1).toUpperCase()}</span>
            <span className="hidden text-left leading-tight xl:block"><span className="block text-sm font-semibold text-navy">{user.name}</span><span className="block text-[11px] capitalize text-muted-foreground">{user.role}</span></span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel className="flex items-center gap-2"><UserRound />{user.name} · <span className="capitalize">{user.role}</span></DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onSelect={() => { void logout(); }}><LogOut />Log out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
