import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input type={type} data-slot="input" className={cn("flex h-10 w-full min-w-0 rounded-xl border border-input bg-card px-3 py-2 text-sm shadow-xs transition-[color,box-shadow,border-color] outline-none placeholder:text-muted-foreground/70 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/15 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive", className)} {...props} />
  );
}

export { Input };
