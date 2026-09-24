"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Keeps server data fresh: refreshes on an interval and whenever the tab regains focus. */
export function AutoRefresh({ interval = 30_000 }: { interval?: number }) {
  const router = useRouter();
  useEffect(() => {
    const tick = () => { if (document.visibilityState === "visible") router.refresh(); };
    const t = setInterval(tick, interval);
    window.addEventListener("focus", tick);
    return () => { clearInterval(t); window.removeEventListener("focus", tick); };
  }, [router, interval]);
  return null;
}
