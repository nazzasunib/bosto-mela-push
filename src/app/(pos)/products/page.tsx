import type { Metadata } from "next";
import { ProductsView } from "@/components/products/products-view";
import { getCategories, getSettings, listProducts } from "@/lib/queries/data";
import { requireSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Products" };
export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const [user, products, categories, settings] = await Promise.all([requireSession(), listProducts(), getCategories(), getSettings()]);
  return <ProductsView products={products} categories={categories} threshold={settings.low_stock_threshold} isAdmin={user.role === "admin"} />;
}
