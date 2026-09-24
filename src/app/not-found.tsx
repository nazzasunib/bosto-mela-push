import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center p-6">
      <div className="text-center">
        <p className="text-6xl font-extrabold text-navy">404</p>
        <p className="mt-2 text-muted-foreground">This page does not exist.</p>
        <Button asChild className="mt-6"><Link href="/">Back to Dashboard</Link></Button>
      </div>
    </div>
  );
}
