"use client";
import Link from "next/link";
import { useEffect } from "react";
import { FileText, Printer, Receipt, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InvoiceToolbar({ id, size, autoPrint }: { id: string; size: "receipt" | "a4"; autoPrint: boolean }) {
  useEffect(() => {
    if (!autoPrint) return;
    const t = setTimeout(() => window.print(), 350);
    return () => clearTimeout(t);
  }, [autoPrint]);
  return (
    <div className="no-print mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center justify-center gap-2 px-4">
      <Button onClick={() => window.print()}><Printer />Print Invoice</Button>
      <Button asChild variant={size === "receipt" ? "secondary" : "outline"}><Link href={`/invoice/${id}`}><Receipt />Receipt 80mm</Link></Button>
      <Button asChild variant={size === "a4" ? "secondary" : "outline"}><Link href={`/invoice/${id}?size=a4`}><FileText />A4</Link></Button>
      <Button variant="ghost" onClick={() => { window.close(); setTimeout(() => history.back(), 150); }}><X />Close</Button>
    </div>
  );
}
