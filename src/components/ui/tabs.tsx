"use client";
import * as React from "react";
import { Tabs as TabsPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;
function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return <TabsPrimitive.List className={cn("inline-flex h-10 items-center gap-1 rounded-xl bg-secondary p-1 text-muted-foreground overflow-x-auto scrollbar-thin max-w-full", className)} {...props} />;
}
function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return <TabsPrimitive.Trigger className={cn("inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-sm font-semibold transition-all cursor-pointer hover:text-navy data-[state=active]:bg-card data-[state=active]:text-navy data-[state=active]:shadow-soft [&_svg]:size-4", className)} {...props} />;
}
function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn("mt-4 outline-none data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-1 duration-200", className)} {...props} />;
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
