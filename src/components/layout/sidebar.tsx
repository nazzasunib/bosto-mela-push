"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronsLeft, X } from "lucide-react";
import { Logo } from "@/components/common/logo";
import { NAV, isActive } from "./nav";
import { cn } from "@/lib/utils";

function NavLinks({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto scrollbar-thin px-3 py-4">
      {NAV.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} onClick={onNavigate} title={collapsed ? item.label : undefined}
            className={cn("group relative flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors", active ? "text-white" : "text-blue-100/70 hover:bg-white/[0.06] hover:text-white")}>
            {active && <motion.span layoutId="nav-active" className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue to-blue/70 shadow-[0_8px_24px_-8px_rgb(37_99_235/0.7)]" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
            <Icon className="relative z-10 size-[19px] shrink-0 transition-transform group-hover:scale-110" />
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.15 }} className="relative z-10 flex flex-1 items-center justify-between whitespace-nowrap">
                  {item.label}
                  {item.shortcut && <kbd className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-bold", active ? "bg-white/20 text-white" : "bg-white/5 text-blue-100/50")}>{item.shortcut}</kbd>}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <motion.aside animate={{ width: collapsed ? 84 : 264 }} transition={{ type: "spring", stiffness: 400, damping: 40 }}
      className="no-print sticky top-0 hidden h-dvh shrink-0 flex-col overflow-hidden brand-mesh text-white lg:flex">
      <div className="flex h-[72px] items-center px-[22px]"><Logo light compact={collapsed} /></div>
      <div className="mx-5 h-px bg-white/10" />
      <NavLinks collapsed={collapsed} />
      <div className="p-3">
        <button onClick={onToggle} className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-xs font-semibold text-blue-100/60 transition hover:bg-white/[0.06] hover:text-white" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          <motion.span animate={{ rotate: collapsed ? 180 : 0 }}><ChevronsLeft className="size-4" /></motion.span>
          {!collapsed && "Collapse"}
        </button>
      </div>
    </motion.aside>
  );
}

export function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-40 bg-navy-deep/50 backdrop-blur-sm lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside className="fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] flex-col brand-mesh text-white shadow-2xl lg:hidden" initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", stiffness: 420, damping: 40 }}>
            <div className="flex h-[68px] items-center justify-between px-5">
              <Logo light />
              <button onClick={onClose} className="rounded-lg p-2 text-blue-100/70 hover:bg-white/10 cursor-pointer" aria-label="Close menu"><X className="size-5" /></button>
            </div>
            <div className="mx-5 h-px bg-white/10" />
            <NavLinks collapsed={false} onNavigate={onClose} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
