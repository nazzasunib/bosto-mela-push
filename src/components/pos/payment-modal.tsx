"use client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PaymentPanel } from "./payment-panel";
import type { ComponentProps } from "react";

/** Checkout dialog used on tablets/phones where the payment panel is not shown beside the cart. */
export function PaymentModal({ open, onOpenChange, ...panel }: { open: boolean; onOpenChange: (o: boolean) => void } & ComponentProps<typeof PaymentPanel>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Checkout</DialogTitle><DialogDescription>Choose payment and confirm the sale.</DialogDescription></DialogHeader>
        <PaymentPanel {...panel} />
      </DialogContent>
    </Dialog>
  );
}
