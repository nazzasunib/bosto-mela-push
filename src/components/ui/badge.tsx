import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ring-1 ring-inset [&_svg]:size-3", {
  variants: {
    variant: {
      default: "bg-accent text-royal ring-blue/15",
      success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
      warning: "bg-amber-50 text-amber-700 ring-amber-600/20",
      danger: "bg-red-50 text-red-700 ring-red-600/20",
      muted: "bg-slate-100 text-slate-600 ring-slate-500/15",
      navy: "bg-navy text-white ring-navy",
    },
  },
  defaultVariants: { variant: "default" },
});

function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
