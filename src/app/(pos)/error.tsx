"use client";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto mt-16 max-w-md rounded-2xl border bg-card p-8 text-center shadow-soft">
      <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-red-50 text-red-600"><AlertTriangle className="size-6" /></div>
      <h2 className="text-lg font-bold text-navy">Could not load this page</h2>
      <p className="mt-2 text-sm text-muted-foreground">{error.message || "Something went wrong while talking to the database."}</p>
      <Button className="mt-6" onClick={reset}><RefreshCw />Try again</Button>
    </div>
  );
}
