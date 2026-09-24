"use client";
import * as React from "react";
import { DropdownMenu as DM } from "radix-ui";
import { cn } from "@/lib/utils";

const DropdownMenu = DM.Root;
const DropdownMenuTrigger = DM.Trigger;
function DropdownMenuContent({ className, sideOffset = 6, ...props }: React.ComponentProps<typeof DM.Content>) {
  return (
    <DM.Portal>
      <DM.Content sideOffset={sideOffset} className={cn("z-50 min-w-44 overflow-hidden rounded-xl border bg-popover p-1 text-popover-foreground shadow-lift data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2", className)} {...props} />
    </DM.Portal>
  );
}
function DropdownMenuItem({ className, destructive, ...props }: React.ComponentProps<typeof DM.Item> & { destructive?: boolean }) {
  return <DM.Item className={cn("relative flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-4 [&_svg]:text-muted-foreground", destructive && "text-destructive focus:bg-red-50 focus:text-destructive [&_svg]:text-destructive", className)} {...props} />;
}
function DropdownMenuLabel({ className, ...props }: React.ComponentProps<typeof DM.Label>) {
  return <DM.Label className={cn("px-2.5 py-1.5 text-xs font-semibold text-muted-foreground", className)} {...props} />;
}
function DropdownMenuSeparator({ className, ...props }: React.ComponentProps<typeof DM.Separator>) {
  return <DM.Separator className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />;
}

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator };
