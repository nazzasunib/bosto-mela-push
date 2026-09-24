import { ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <div className={cn("relative grid size-10 shrink-0 place-items-center rounded-xl brand-gradient text-white shadow-lift ring-1 ring-white/10", className)}>
      <ShoppingBag className="size-5" strokeWidth={2.2} />
      <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-navy bg-blue" />
    </div>
  );
}

export function Logo({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <LogoMark />
      {!compact && (
        <div className="leading-tight min-w-0">
          <div className={cn("text-[17px] font-extrabold tracking-tight whitespace-nowrap", light ? "text-white" : "text-navy")}>Bosto Mela <span className={light ? "text-blue-300" : "text-blue"}>PoS</span></div>
          <div className={cn("text-[11px] font-medium tracking-wide uppercase", light ? "text-blue-100/60" : "text-muted-foreground")}>Clothing Store</div>
        </div>
      )}
    </div>
  );
}
