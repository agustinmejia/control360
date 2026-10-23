import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DocumentType } from "./labels";

/** Inventarios a los que el usuario tiene acceso (RLS), con su sucursal. */
export async function listInventories({ includeInactive = false } = {}) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("inventories")
    .select(
      "id, name, description, is_active, deactivation_reason, branch_id, branches(name, is_active)",
    )
    .order("name");
  if (!includeInactive) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw error;
  return data.map((i) => ({
    id: i.id,
    name: i.name,
    description: i.description,
    isActive: i.is_active,
    deactivationReason: i.deactivation_reason,
    branchId: i.branch_id,
    branchName: i.branches?.name ?? "—",
  }));
}

export type InventoryOption = Awaited<ReturnType<typeof listInventories>>[number];

export async function getCatalog({ includeInactive = false } = {}) {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("v_catalog").select("*").order("display_name");
  if (!includeInactive) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export type CatalogItem = Awaited<ReturnType<typeof getCatalog>>[number];

export async function listReasons(type: DocumentType) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("movement_reasons")
    .select("id, name, code")
    .eq("document_type", type)
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return data;
}

export async function getStock(
  filters: { inventoryId?: string; categoryId?: string; belowMin?: boolean } = {},
) {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("v_stock").select("*").order("display_name").order("inventory_name");
  if (filters.inventoryId) query = query.eq("inventory_id", filters.inventoryId);
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.belowMin) query = query.eq("below_min", true);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export type StockRow = Awaited<ReturnType<typeof getStock>>[number];

export async function listDocuments(filters: {
  inventoryId?: string;
  type?: DocumentType;
  from?: string;
  to?: string;
  limit?: number;
}) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("v_inventory_documents")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(filters.limit ?? 100);
  if (filters.inventoryId) {
    query = query.or(
      `inventory_id.eq.${filters.inventoryId},target_inventory_id.eq.${filters.inventoryId}`,
    );
  }
  if (filters.type) query = query.eq("document_type", filters.type);
  if (filters.from) query = query.gte("document_date", filters.from);
  if (filters.to) query = query.lte("document_date", filters.to);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getDocument(id: string) {
  const supabase = await createSupabaseServerClient();
  const [{ data: doc }, { data: lines }] = await Promise.all([
    supabase.from("v_inventory_documents").select("*").eq("id", id).maybeSingle(),
    supabase.from("v_kardex").select("*").eq("document_id", id).order("id"),
  ]);
  return doc ? { doc, lines: lines ?? [] } : null;
}

export async function getKardex(
  variantId: string,
  inventoryId: string,
  from?: string,
  to?: string,
) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("v_kardex")
    .select("*")
    .eq("variant_id", variantId)
    .eq("inventory_id", inventoryId)
    .order("movement_date")
    .order("id");
  if (from) query = query.gte("movement_date", from);
  if (to) query = query.lte("movement_date", to);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getProduct(id: string) {
  const supabase = await createSupabaseServerClient();
  const [{ data: product }, { data: variants }, { data: prices }, { data: history }] =
    await Promise.all([
      supabase
        .from("products")
        .select("*, units(name, symbol), product_categories(name)")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("product_variants")
        .select("*, units(name, symbol, allows_decimals)")
        .eq("product_id", id)
        .order("is_default", { ascending: false })
        .order("factor"),
      supabase.from("inventory_prices").select("inventory_id, variant_id, price"),
      supabase
        .from("price_changes")
        .select(
          "id, variant_id, inventory_id, old_price, new_price, reason, changed_at, changed_by, product_variants!inner(product_id)",
        )
        .eq("product_variants.product_id", id)
        .order("changed_at", { ascending: false })
        .limit(30),
    ]);
  if (!product) return null;
  return { product, variants: variants ?? [], prices: prices ?? [], history: history ?? [] };
}

export async function listUnits() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("units")
    .select("id, name, symbol, allows_decimals, is_active")
    .order("name");
  return data ?? [];
}

export async function listCategories({ includeInactive = false } = {}) {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("product_categories").select("id, name, is_active").order("name");
  if (!includeInactive) query = query.eq("is_active", true);
  const { data } = await query;
  return data ?? [];
}

export async function listTransferTargets() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("inv_transfer_targets");
  return (data ?? []).map((t) => ({ id: t.id, name: t.name, branchName: t.branch_name }));
}
