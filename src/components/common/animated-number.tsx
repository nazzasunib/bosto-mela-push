"use client";
import { useEffect, useRef } from "react";
import { animate, useInView, useMotionValue, useReducedMotion } from "framer-motion";
import { num, taka } from "@/lib/format";

export function AnimatedNumber({ value, currency = false, duration = 0.9 }: { value: number; currency?: boolean; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const mv = useMotionValue(0);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const fmt = currency ? taka : num;

  useEffect(() => {
    if (!inView) return;
    if (reduce) { mv.set(value); if (ref.current) ref.current.textContent = fmt(value); return; }
    const controls = animate(mv, value, { duration, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => { if (ref.current) ref.current.textContent = fmt(currency ? Math.round(v * 100) / 100 : Math.round(v)); } });
    return () => controls.stop();
  }, [value, inView, reduce, duration, mv, fmt, currency]);

  return <span ref={ref} className="tabular">{fmt(0)}</span>;
}
