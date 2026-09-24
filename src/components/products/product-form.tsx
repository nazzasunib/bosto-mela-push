"use client";
import { useRef, useState } from "react";
import { Check, ImagePlus, Loader2, Plus, RefreshCw, Save, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/common/field";
import { decodeCostCode, normalizeCode } from "@/lib/code-parser";
import { saveProduct, uploadProductImage } from "@/lib/actions/catalog";
import { joinSizes, parseSizes, SIZE_OPTIONS, taka } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product, ProductStatus } from "@/lib/types";

const NEW_CAT = "__new__";
const genBarcode = () => `2${Date.now().toString().slice(-10)}${Math.floor(Math.random() * 10)}`;

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={cn("inline-flex h-9 min-w-11 cursor-pointer items-center justify-center gap-1 rounded-xl border px-3 text-sm font-semibold transition", active ? "border-navy bg-navy text-white shadow-xs" : "bg-card text-navy hover:border-blue/50 hover:bg-accent")}>
      {active && <Check className="size-3.5" />}{children}
    </button>
  );
}

export function ProductForm({ open, onOpenChange, product, categories }: { open: boolean; onOpenChange: (o: boolean) => void; product: Product | null; categories: string[] }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        {open && <ProductFormBody key={product?.id ?? "new"} product={product} categories={categories} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function ProductFormBody({ product, categories, onDone }: { product: Product | null; categories: string[]; onDone: () => void }) {
  const [f, setF] = useState({
    name: product?.name ?? "", code: product?.code ?? "", category: product?.category ?? "", size: product?.size ?? "", color: product?.color ?? "",
    barcode: product?.barcode ?? "", imageUrl: product?.image_url ?? "", status: (product?.status ?? "active") as ProductStatus, initialStock: "",
  });
  const decodedInitial = product ? decodeCostCode(product.code) : null;
  const [manualCost, setManualCost] = useState(product ? decodedInitial !== product.cost_price : false);
  const [cost, setCost] = useState(product ? String(product.cost_price) : "");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [newCat, setNewCat] = useState(false);
  const categoryOptions = f.category && !categories.includes(f.category) && !newCat ? [f.category, ...categories] : categories;
  const sizes = parseSizes(f.size);
  // keep any non-standard size an older product already has (e.g. "32") selectable
  const sizeOptions = [...SIZE_OPTIONS, ...parseSizes(product?.size).filter((z) => !(SIZE_OPTIONS as readonly string[]).includes(z))];
  const toggleSize = (z: string) => setF((s) => { const cur = parseSizes(s.size); return { ...s, size: joinSizes(cur.includes(z) ? cur.filter((x) => x !== z) : [...cur, z]) }; });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  const decoded = decodeCostCode(f.code);
  const effectiveCost = manualCost ? Number(cost) : decoded;

  const upload = async (file: File) => {
    setUploading(true);
    const fd = new FormData(); fd.append("file", file);
    const res = await uploadProductImage(fd);
    setUploading(false);
    if (res.ok) { setF((s) => ({ ...s, imageUrl: res.data.url })); toast.success("Image uploaded"); } else toast.error(res.error);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name.trim() || !f.code.trim()) { toast.error("Name and code are required."); return; }
    if (effectiveCost === null || !Number.isFinite(effectiveCost)) { toast.error("Enter a valid cost code or a manual cost price."); return; }
    setBusy(true);
    const res = await saveProduct({ id: product?.id, ...f, costPrice: manualCost ? Number(cost) : null, sellingPrice: 0, initialStock: Number(f.initialStock) || 0 });
    setBusy(false);
    if (!res.ok) { toast.error(res.error); return; }
    toast.success(product ? "Product updated" : "Product added");
    onDone();
  };

  return (
    <form onSubmit={submit} className="grid gap-5">
      <DialogHeader><DialogTitle>{product ? "Edit product" : "Add product"}</DialogTitle><DialogDescription>Cost price is calculated from the product code automatically.</DialogDescription></DialogHeader>
      <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Product name *" htmlFor="p-name" className="sm:col-span-2"><Input id="p-name" value={f.name} onChange={set("name")} placeholder="e.g. Cotton Panjabi" autoFocus required /></Field>
          <Field label="Product code *" htmlFor="p-code" hint={decoded !== null ? <span className="flex items-center gap-1 text-emerald-700"><Sparkles className="size-3" />Decoded cost: <b>{taka(decoded)}</b></span> : f.code ? <span className="text-amber-700">Not a cost code — enter cost manually.</span> : "B=1 R=2 I=3 G=4 H=5 T=6 D=7 A=8 Y=9 S=0"}>
            <Input id="p-code" value={f.code} onChange={(e) => { const code = normalizeCode(e.target.value); setF((s) => ({ ...s, code })); if (decodeCostCode(code) === null && code) setManualCost(true); }} placeholder="BSS" className="font-mono text-base font-bold uppercase" required />
          </Field>
          <Field label="Category" htmlFor="p-cat">
            {newCat || categories.length === 0 ? (
              <div className="flex gap-2">
                <Input id="p-cat" value={f.category} onChange={set("category")} placeholder="New category, e.g. Panjabi" autoFocus={newCat} />
                {categories.length > 0 && <Button type="button" variant="outline" size="icon" onClick={() => { setNewCat(false); setF((s) => ({ ...s, category: product?.category ?? "" })); }} title="Choose existing"><X /></Button>}
              </div>
            ) : (
              <Select value={f.category} onValueChange={(v) => { if (v === NEW_CAT) { setNewCat(true); setF((s) => ({ ...s, category: "" })); } else setF((s) => ({ ...s, category: v })); }}>
                <SelectTrigger id="p-cat"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  <SelectItem value={NEW_CAT} className="font-semibold text-blue"><span className="flex items-center gap-1.5"><Plus className="size-3.5" />New category…</span></SelectItem>
                </SelectContent>
              </Select>
            )}
          </Field>
          <Field label="Color" htmlFor="p-color"><Input id="p-color" value={f.color} onChange={set("color")} placeholder="Navy" /></Field>
          <Field label="Sizes (optional)" hint={sizes.length ? `Selected: ${joinSizes(sizes).replaceAll(",", ", ")}` : "Tap the sizes this product comes in."} className="sm:col-span-2">
            <div className="flex flex-wrap gap-2">{sizeOptions.map((z) => <Chip key={z} active={sizes.includes(z)} onClick={() => toggleSize(z)}>{z}</Chip>)}</div>
          </Field>
        </div>
        <div className="grid content-start gap-1.5">
          <span className="text-[13px] font-semibold text-foreground/80">Image</span>
          <div className="relative grid aspect-square place-items-center overflow-hidden rounded-2xl border-2 border-dashed bg-muted/50">
            {f.imageUrl ? (
              <>
                <img src={f.imageUrl} alt="" className="size-full object-cover" />
                <button type="button" onClick={() => setF((s) => ({ ...s, imageUrl: "" }))} className="absolute top-1.5 right-1.5 rounded-lg bg-white/90 p-1 shadow cursor-pointer" aria-label="Remove image"><X className="size-3.5" /></button>
              </>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()} className="flex size-full cursor-pointer flex-col items-center justify-center gap-1 text-xs text-muted-foreground hover:text-navy">
                {uploading ? <Loader2 className="size-6 animate-spin" /> : <ImagePlus className="size-6" />}{uploading ? "Uploading…" : "Upload"}
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) void upload(file); e.target.value = ""; }} />
          <Input value={f.imageUrl} onChange={set("imageUrl")} placeholder="or image URL" className="h-8 text-xs" />
        </div>
      </div>

      <div className="grid gap-4 rounded-2xl bg-secondary/60 p-4 sm:grid-cols-2">
        <Field label="Cost price" htmlFor="p-cost" hint={<button type="button" className="font-semibold text-blue hover:underline cursor-pointer" onClick={() => { if (manualCost && decoded !== null) { setManualCost(false); } else { setManualCost(true); setCost(String(decoded ?? "")); } }}>{manualCost ? (decoded !== null ? "Use code price" : "Manual cost") : "Override manually"}</button>}>
          <Input id="p-cost" type="number" min={0} step="0.01" value={manualCost ? cost : decoded ?? ""} readOnly={!manualCost} onChange={(e) => setCost(e.target.value)} className={manualCost ? "border-amber-400" : "bg-muted font-semibold"} />
        </Field>
        {product ? (
          <Field label="Current stock" hint="Change stock from the Stock page"><Input value={product.stock_quantity} readOnly className="bg-muted" /></Field>
        ) : (
          <Field label="Quantity (pieces)" htmlFor="p-stock" hint="How many pieces you have in stock now."><Input id="p-stock" type="number" min={0} step={1} value={f.initialStock} onChange={set("initialStock")} placeholder="e.g. 20" /></Field>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Barcode / SKU" htmlFor="p-barcode">
          <div className="flex gap-2"><Input id="p-barcode" value={f.barcode} onChange={set("barcode")} placeholder="Scan or type" className="font-mono" /><Button type="button" variant="outline" size="icon" onClick={() => setF((s) => ({ ...s, barcode: genBarcode() }))} title="Generate barcode"><RefreshCw /></Button></div>
        </Field>
        <Field label="Status">
          <Select value={f.status} onValueChange={(v) => setF((s) => ({ ...s, status: v as ProductStatus }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
          </Select>
        </Field>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>Cancel</Button>
        <Button type="submit" disabled={busy || uploading}>{busy ? <Loader2 className="animate-spin" /> : <Save />}{product ? "Save changes" : "Add product"}</Button>
      </DialogFooter>
    </form>
  );
}
