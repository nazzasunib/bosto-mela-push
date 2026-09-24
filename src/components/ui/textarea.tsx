import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea data-slot="textarea" className={cn("flex min-h-20 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground/70 focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/15 disabled:opacity-50", className)} {...props} />;
}

export { Textarea };
