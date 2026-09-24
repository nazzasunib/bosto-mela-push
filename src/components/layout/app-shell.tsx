"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { MobileSidebar, Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import type { SessionUser } from "@/lib/types";

const KEY = "bm.sidebar.collapsed";
const EVT = "bm:sidebar";
const readCollapsed = () => { try { return localStorage.getItem(KEY) === "1"; } catch { return false; } };
const subscribe = (cb: () => void) => { window.addEventListener(EVT, cb); window.addEventListener("storage", cb); return () => { window.removeEventListener(EVT, cb); window.removeEventListener("storage", cb); }; };

export function AppShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const collapsed = useSyncExternalStore(subscribe, readCollapsed, () => false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggle = () => { try { localStorage.setItem(KEY, collapsed ? "0" : "1"); } catch { /* storage unavailable */ } window.dispatchEvent(new Event(EVT)); };

  // Global shortcuts: Ctrl/Cmd+K → product search, F2 → New Sale
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); window.dispatchEvent(new CustomEvent("bm:search")); }
      if (e.key === "F2") { e.preventDefault(); router.push("/sale"); }
    };
    const onSearch = () => { if (window.location.pathname !== "/sale") router.push("/sale?focus=1"); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("bm:search", onSearch);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("bm:search", onSearch); };
  }, [router]);

  return (
    <div className="flex min-h-dvh">
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} onMenu={() => setMobileOpen(true)} />
        <motion.main key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: "easeOut" }} className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          {children}
        </motion.main>
      </div>
    </div>
  );
}
