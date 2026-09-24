"use client";
import * as React from "react";
import { Select as SelectPrimitive } from "radix-ui";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const Select = SelectPrimitive.Root;
const SelectValue = SelectPrimitive.Value;
const SelectGroup = SelectPrimitive.Group;

function SelectTrigger({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger className={cn("flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-input bg-card px-3 text-sm shadow-xs outline-none transition focus-visible:border-blue focus-visible:ring-[3px] focus-visible:ring-blue/15 disabled:opacity-50 data-[placeholder]:text-muted-foreground cursor-pointer [&>span]:truncate", className)} {...props}>
      {children}
      <SelectPrimitive.Icon asChild><ChevronDownIcon className="size-4 opacity-60" /></SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}
function SelectContent({ className, children, position = "popper", ...props }: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content position={position} sideOffset={6} className={cn("relative z-50 max-h-72 min-w-[8rem] overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-lift data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2", position === "popper" && "w-full min-w-[var(--radix-select-trigger-width)]", className)} {...props}>
        <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}
function SelectItem({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item className={cn("relative flex w-full cursor-pointer items-center rounded-lg py-2 pr-8 pl-2.5 text-sm outline-none select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className)} {...props}>
      <span className="absolute right-2 flex size-4 items-center justify-center"><SelectPrimitive.ItemIndicator><CheckIcon className="size-4 text-blue" /></SelectPrimitive.ItemIndicator></span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

export { Select, SelectValue, SelectGroup, SelectTrigger, SelectContent, SelectItem };
