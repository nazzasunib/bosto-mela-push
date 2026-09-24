import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";

export const metadata: Metadata = { title: { default: "Bosto Mela PoS", template: "%s · Bosto Mela PoS" }, description: "Point of Sale for Bosto Mela clothing store" };
export const viewport: Viewport = { themeColor: "#0B1F3A", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans">
        {children}
        <Toaster position="top-right" richColors closeButton toastOptions={{ classNames: { toast: "!rounded-xl !shadow-lift !font-sans" } }} />
      </body>
    </html>
  );
}
