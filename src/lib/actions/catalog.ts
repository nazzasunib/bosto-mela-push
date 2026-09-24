"use server";
import { actionUser } from "@/lib/auth";
import { db } from "@/lib/supabase/server";
import { decodeCostCode, normalizeCode } from "@/lib/code-parser";
import { ensure, numVal, run, str } from "./helpers";
import type { ActionResult, ProductStatus } from "@/lib/types";

export interface ProductInput {
  id?: string; name: string; code: string; category: string; size: string; color: string;
  costPrice: number | null; sellingPrice: number; initialStock?: number; barcode: string; imageUrl: string; status: ProductStatus;
}

export async function saveProduct(input: ProductInput): Promise<ActionResult<{ id: string }>> {
  return run(async () => {
    const user = await actionUser();
    const name = str(input.name, 120); const code = normalizeCode(str(input.code, 40));
    ensure(name, "Product name is required."); ensure(code, "Product code is required.");
    const decoded = decodeCostCode(code);
    const cost = input.costPrice === null || Number.isNaN(numVal(input.costPrice)) ? decoded : numVal(input.costPrice);
    ensure(cost !== null && cost >= 0, "Cost price is required (or use a valid cost code).");
    const price = numVal(input.sellingPrice);
    ensure(price >= 0, "Selling price is required.");
    const row = {
      name, code, category: str(input.category, 60) || "General", size: str(input.size, 30), color: str(input.color, 40),
      cost_price: cost, selling_price: price, barcode: str(input.barcode, 64) || null, image_url: str(input.imageUrl, 500) || null,
      status: input.status === "inactive" ? "inactive" : "active", updated_at: new Date().toISOString(),
    };
    if (input.id) {
      const { error } = await db().from("products").update(row).eq("id", input.id);
      if (error) throw error;
      return { id: input.id };
    }
    const { data, error } = await db().from("products").insert({ ...row, stock_quantity: 0 }).select("id").single();
    if (error) throw error;
    const id = (data as { id: string }).id;
    const initial = Math.trunc(numVal(input.initialStock ?? 0));
    if (initial > 0) {
      const r = await db().rpc("adjust_stock", { p_product_id: id, p_qty: initial, p_type: "stock_in", p_note: "Opening stock", p_user: user.id });
      if (r.error) throw r.error;
    }
    return { id };
  });
}

export async function setProductStatus(id: string, status: ProductStatus): Promise<ActionResult> {
  return run(async () => {
    await actionUser();
    const { error } = await db().from("products").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) throw error;
    return null;
  });
}

/** Deletes a product only if it has never been sold or moved; otherwise it is deactivated. */
export async function deleteProduct(id: string): Promise<ActionResult<{ deactivated: boolean }>> {
  return run(async () => {
    await actionUser(true);
    const [{ count: moves }, { count: sold }] = await Promise.all([
      db().from("stock_movements").select("id", { count: "exact", head: true }).eq("product_id", id),
      db().from("sale_items").select("id", { count: "exact", head: true }).eq("product_id", id),
    ]);
    if ((moves ?? 0) > 0 || (sold ?? 0) > 0) {
      const { error } = await db().from("products").update({ status: "inactive", updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      return { deactivated: true };
    }
    const { error } = await db().from("products").delete().eq("id", id);
    if (error) throw error;
    return { deactivated: false };
  });
}

export async function uploadProductImage(form: FormData): Promise<ActionResult<{ url: string }>> {
  return run(async () => {
    await actionUser();
    const file = form.get("file");
    ensure(file instanceof File && file.size > 0, "Choose an image file.");
    ensure(file.size <= 3 * 1024 * 1024, "Image must be 3 MB or smaller.");
    ensure(/^image\/(png|jpe?g|webp|gif)$/.test(file.type), "Use a PNG, JPG, WEBP or GIF image.");
    const ext = file.type.split("/")[1].replace("jpeg", "jpg");
    const path = `products/${crypto.randomUUID()}.${ext}`;
    const { error } = await db().storage.from("product-images").upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
    if (error) throw error;
    return { url: db().storage.from("product-images").getPublicUrl(path).data.publicUrl };
  }, false);
}

export async function adjustStock(input: { productId: string; quantity: number; type: "stock_in" | "adjustment"; note?: string }): Promise<ActionResult<{ stock: number }>> {
  return run(async () => {
    const user = await actionUser();
    const qty = Math.trunc(numVal(input.quantity));
    ensure(Number.isFinite(qty) && qty !== 0, "Enter a quantity.");
    const { data, error } = await db().rpc("adjust_stock", { p_product_id: input.productId, p_qty: qty, p_type: input.type, p_note: str(input.note, 300) || null, p_user: user.id });
    if (error) throw error;
    return { stock: Number(data) };
  });
}
