"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Eraser, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ProductSearch, type ProductSearchHandle } from "./product-search";
import { POSCart } from "./pos-cart";
import { PaymentPanel } from "./payment-panel";
import { PaymentModal } from "./payment-modal";
import { SaleSuccessModal } from "./sale-success-modal";
import { VariantPicker } from "./variant-picker";
import { useCart } from "./use-cart";
import { completeSale } from "@/lib/actions/pos";
import { taka } from "@/lib/format";
import type { Product, SaleWithItems } from "@/lib/types";

export function POSScreen({ products }: { products: Product[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const cart = useCart(products);
  const searchRef = useRef<ProductSearchHandle>(null);
  const paidRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const [variants, setVariants] = useState<{ options: Product[]; qty: number }>({ options: [], qty: 1 });
  const [done, setDone] = useState<SaleWithItems | null>(null);
  const [checkout, setCheckout] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const focusSearch = useCallback(() => setTimeout(() => searchRef.current?.focus(), 30), []);

  const addProduct = useCallback((p: Product, qty: number) => {
    if (p.status !== "active") { toast.error(`${p.name} is inactive.`); return; }
    const r = cart.add(p, qty);
    if (r.status === "out") toast.error(`${p.name} (${p.code}) is out of stock.`);
    else if (r.status === "capped") toast.warning(`Only ${r.quantity} more of ${p.code} available — added ${r.quantity}.`);
    const defaultPrice = p.selling_price > 0 ? p.selling_price : 0;
    toast.success(`${p.code} × ${qty} added`, { duration: 1200, description: `${p.name} · ${taka(defaultPrice * qty)}` });
    if (r.status !== "out") { setLastAdded(p.id); setTimeout(() => setLastAdded((x) => (x === p.id ? null : x)), 1200); }
    focusSearch();
  }, [cart, focusSearch]);

  const onPick = useCallback((matches: Product[], qty: number, term: string) => {
    if (matches.length === 0) { toast.error(`No product found for “${term}”.`); return; }
    const active = matches.filter((m) => m.status === "active");
    if (active.length === 1) addProduct(active[0], qty);
    else if (active.length > 1) setVariants({ options: active, qty });
    else toast.error(`${matches[0].name} is inactive.`);
  }, [addProduct]);

  const submit = useCallback(async () => {
    if (busy || cart.items.length === 0) return;
    const paid = cart.paid === "" ? cart.totals.total : Number(cart.paid);
    if (!Number.isFinite(paid) || paid < cart.totals.total) { toast.error("Amount paid is less than the total."); paidRef.current?.focus(); return; }
    setBusy(true);
    const res = await completeSale({
      items: cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity, discount: i.discount, unitPrice: i.price })),
      orderDiscount: cart.orderDiscount, paymentMethod: cart.method, amountPaid: paid, customerPhone: cart.phone, clientRef: cart.ref,
    });
    setBusy(false);
    if (!res.ok) { toast.error(res.error); return; }
    setCheckout(false); cart.clear(); setDone(res.data); router.refresh();
  }, [busy, cart, router]);

  // keyboard: Ctrl/Cmd+Enter complete, F4 paid, search event, auto-capture scanner typing
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); void submit(); return; }
      if (e.key === "F4") { e.preventDefault(); paidRef.current?.focus(); return; }
      const el = document.activeElement as HTMLElement | null;
      const typing = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      const dialogOpen = !!document.querySelector("[role=dialog]");
      if (!typing && !dialogOpen && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) searchRef.current?.focus();
    };
    const onSearch = () => searchRef.current?.focus();
    window.addEventListener("keydown", onKey);
    window.addEventListener("bm:search", onSearch);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("bm:search", onSearch); };
  }, [submit]);

  useEffect(() => { if (params.get("focus")) focusSearch(); }, [params, focusSearch]);

  const panelProps = { totals: cart.totals, method: cart.method, paid: cart.paid, orderDiscount: cart.orderDiscount, phone: cart.phone, busy, onChange: cart.patch, onComplete: submit };

  return (
    <div className="grid gap-5 xl:h-[calc(100dvh-72px-56px)] xl:grid-cols-[1fr_380px]">
      <div className="flex min-h-0 flex-col gap-4">
        <ProductSearch ref={searchRef} products={products} onPick={onPick} />
        <div className="flex min-h-[320px] flex-1 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2"><ShoppingCart className="size-4 text-blue" /><span className="font-bold text-navy">Cart</span><span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-royal">{cart.totals.items} items</span></div>
            {cart.items.length > 0 && <Button variant="ghost" size="sm" onClick={() => setConfirmClear(true)}><Eraser />Clear</Button>}
          </div>
          <POSCart items={cart.items} lastAdded={lastAdded} onQty={cart.setQty} onPrice={cart.setPrice} onDiscount={cart.setDiscount} onRemove={(id) => { cart.remove(id); focusSearch(); }} />
        </div>
      </div>

      <aside className="hidden rounded-2xl border border-border/70 bg-card p-5 shadow-soft xl:block xl:overflow-y-auto xl:scrollbar-thin">
        <PaymentPanel ref={paidRef} {...panelProps} />
      </aside>

      <div className="sticky bottom-3 z-20 xl:hidden">
        <Button size="xl" variant="success" className="w-full justify-between shadow-lift" disabled={cart.items.length === 0} onClick={() => setCheckout(true)}>
          <span className="flex items-center gap-2"><ShoppingCart />Checkout · {cart.totals.items}</span><span className="tabular">{taka(cart.totals.total)}</span>
        </Button>
      </div>
      <PaymentModal open={checkout} onOpenChange={setCheckout} {...panelProps} />

      <VariantPicker options={variants.options} quantity={variants.qty} onPick={(p) => { setVariants({ options: [], qty: 1 }); addProduct(p, variants.qty); }} onClose={() => { setVariants({ options: [], qty: 1 }); focusSearch(); }} />
      <SaleSuccessModal sale={done} onClose={() => { setDone(null); focusSearch(); }} />
      <ConfirmDialog open={confirmClear} onOpenChange={setConfirmClear} title="Clear the cart?" description="All items in the current cart will be removed." confirmLabel="Clear cart" destructive onConfirm={() => { cart.clear(); setConfirmClear(false); focusSearch(); }} />
    </div>
  );
}
