"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = "Confirm", destructive, onConfirm, children }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: string; confirmLabel?: string; destructive?: boolean; onConfirm: () => Promise<void> | void; children?: React.ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{title}</DialogTitle>{description && <DialogDescription>{description}</DialogDescription>}</DialogHeader>
        {children}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button variant={destructive ? "destructive" : "default"} disabled={busy} onClick={async () => { setBusy(true); try { await onConfirm(); } finally { setBusy(false); } }}>
            {busy && <Loader2 className="animate-spin" />}{confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
