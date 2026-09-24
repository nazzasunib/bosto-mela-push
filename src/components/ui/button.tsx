import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-soft hover:bg-royal hover:shadow-lift",
        blue: "bg-blue text-white shadow-soft hover:bg-blue/90 hover:shadow-lift",
        success: "bg-success text-white shadow-soft hover:bg-success/90",
        destructive: "bg-destructive text-white shadow-soft hover:bg-destructive/90",
        outline: "border border-input bg-card hover:bg-accent hover:text-accent-foreground hover:border-blue/30",
        secondary: "bg-secondary text-secondary-foreground hover:bg-accent",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-blue underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 px-6 text-base",
        xl: "h-16 px-8 text-lg rounded-2xl",
        icon: "size-10",
        "icon-sm": "size-8 rounded-lg",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

function Button({ className, variant, size, asChild = false, ...props }: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
