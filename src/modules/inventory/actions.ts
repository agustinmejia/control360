"use server";

import { revalidatePath } from "next/cache";
import { AppError, fromPostgrestError } from "@/lib/errors";
import { runAction } from "@/lib/result";
import { z } from "@/lib/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { can, type Permission } from "@/modules/access/roles";
import { getCurrentUser } from "@/modules/access/session";
import {
  activeSchema,
  categorySchema,
  documentSchema,
  inventorySchema,
  newProductSchema,
  priceSchema,
  productSchema,
  variantSchema,
  voidDocumentSchema,
} from "./schemas";

async function authorize(permission: Permission) {
  const user = await getCurrentUser();
  if (!user || !user.isActive) throw new AppError("UNAUTHENTICATED");
  if (!can(user.role, permission)) throw new AppError("FORBIDDEN");
  return createSupabaseServerClient();
}

function check<T>({
  data,
  error,
}: {
  data: T | null;
  error: { code?: string; message?: string; hint?: string | null } | null;
}): T {
  if (error) throw fromPostgrestError(error);
  return data as T;
}

const revalidateInventory = () => revalidatePath("/inventario", "layout");

// ── Documentos ───────────────────────────────────────────────────────────────

/** Registra cualquier documento de inventario. La BD valida stock, fechas, permisos y motivos. */
export async function postDocument(input: unknown) {
  return runAction(documentSchema, input, async (doc) => {
    const supabase = await authorize("operations.write");
    const common = {
      p_date: doc.date,
      p_notes: doc.notes ?? undefined,
      p_request_id: doc.requestId,
    };
    let id: string;
    switch (doc.type) {
      case "opening":
        id = check(
          await supabase.rpc("inv_post_opening", {
            ...common,
            p_inventory: doc.inventoryId,
            p_lines: doc.lines.map((l) => ({
              variant_id: l.variantId,
              quantity: l.quantity,
              unit_cost: l.unitCost,
            })),
          }),
        );
        break;
      case "entry":
      case "exit":
        id = check(
          await supabase.rpc(doc.type === "entry" ? "inv_post_entry" : "inv_post_exit", {
            ...common,
            p_inventory: doc.inventoryId,
            p_reason: doc.reasonId,
            p_lines: doc.lines.map((l) => ({
              variant_id: l.variantId,
              quantity: l.quantity,
              unit_cost: "unitCost" in l ? l.unitCost : null,
            })),
          }),
        );
        break;
      case "adjustment":
        id = check(
          await supabase.rpc("inv_post_adjustment", {
            ...common,
            p_inventory: doc.inventoryId,
            p_reason: doc.reasonId,
            p_lines: doc.lines.map((l) => ({
              variant_id: l.variantId,
              counted_quantity: l.counted,
            })),
          }),
        );
        break;
      case "transfer":
        id = check(
          await supabase.rpc("inv_post_transfer", {
            ...common,
            p_from: doc.inventoryId,
            p_to: doc.targetInventoryId,
            p_lines: doc.lines.map((l) => ({ variant_id: l.variantId, quantity: l.quantity })),
          }),
        );
        break;
      case "conversion":
        id = check(
          await supabase.rpc("inv_post_conversion", {
            ...common,
            p_inventory: doc.inventoryId,
            p_from_variant: doc.fromVariantId,
            p_from_qty: Number(doc.fromQuantity),
            p_to_variant: doc.toVariantId,
            p_to_qty: Number(doc.toQuantity),
          }),
        );
        break;
    }
    revalidateInventory();
    return { id };
  });
}

export async function voidDocument(input: unknown) {
  return runAction(voidDocumentSchema, input, async ({ documentId, reason }) => {
    const supabase = await authorize("operations.write");
    const reversalId = check(
      await supabase.rpc("inv_void_document", { p_document: documentId, p_reason: reason }),
    );
    revalidateInventory();
    return { reversalId };
  });
}

// ── Catálogo ─────────────────────────────────────────────────────────────────

export async function createProduct(input: unknown) {
  return runAction(newProductSchema, input, async (p) => {
    const supabase = await authorize("settings.manage");
    const id = check(
      await supabase.rpc("inv_create_product", {
        p_name: p.name,
        p_base_unit: p.baseUnitId,
        p_category: p.categoryId ?? undefined,
        p_description: p.description ?? undefined,
        p_base_price: Number(p.basePrice),
        p_sku: p.sku ?? undefined,
        p_min_stock: Number(p.minStock),
      }),
    );
    revalidateInventory();
    return { id };
  });
}

export async function updateProduct(input: unknown) {
  return runAction(productSchema, input, async ({ id, name, categoryId, description }) => {
    if (!id) throw new AppError("VALIDATION");
    const supabase = await authorize("settings.manage");
    const { error } = await supabase
      .from("products")
      .update({ name, category_id: categoryId, description })
      .eq("id", id);
    if (error?.code === "23505")
      throw new AppError("DUPLICATE", "Ya existe un producto con ese nombre.");
    if (error) throw fromPostgrestError(error);
    revalidateInventory();
    return { id };
  });
}

export async function saveVariant(input: unknown) {
  return runAction(variantSchema, input, async (v) => {
    const supabase = await authorize("settings.manage");
    if (v.id) {
      const { error } = await supabase
        .from("product_variants")
        .update({ name: v.name, sku: v.sku, min_stock: Number(v.minStock) })
        .eq("id", v.id);
      if (error?.code === "23505")
        throw new AppError("DUPLICATE", "Ya existe una presentación con ese nombre o código.");
      if (error) throw fromPostgrestError(error);
      revalidateInventory();
      return { id: v.id };
    }
    if (!v.unitId || !v.factor) {
      throw new AppError("VALIDATION", undefined, {
        ...(v.unitId ? {} : { unitId: ["Elige la unidad"] }),
        ...(v.factor ? {} : { factor: ["Escribe el factor"] }),
      });
    }
    const id = check(
      await supabase.rpc("inv_add_variant", {
        p_product: v.productId,
        p_name: v.name,
        p_unit: v.unitId,
        p_factor: Number(v.factor),
        p_sku: v.sku ?? undefined,
        p_min_stock: Number(v.minStock),
      }),
    );
    revalidateInventory();
    return { id };
  });
}

export async function setPrice(input: unknown) {
  return runAction(priceSchema, input, async ({ variantId, inventoryId, price, reason }) => {
    const supabase = await authorize("settings.manage");
    if (inventoryId) {
      check(
        await supabase.rpc("inv_set_inventory_price", {
          p_inventory: inventoryId,
          p_variant: variantId,
          p_price: price === null ? (null as unknown as number) : Number(price),
          p_reason: reason,
        }),
      );
    } else {
      if (price === null)
        throw new AppError("VALIDATION", undefined, { price: ["Escribe el precio"] });
      check(
        await supabase.rpc("inv_set_base_price", {
          p_variant: variantId,
          p_price: Number(price),
          p_reason: reason,
        }),
      );
    }
    revalidateInventory();
    return { price };
  });
}

export async function setCatalogActive(input: unknown) {
  return runAction(activeSchema, input, async ({ entity, id, active, reason }) => {
    const supabase = await authorize("settings.manage");
    check(
      await supabase.rpc("inv_set_active", {
        p_entity: entity,
        p_id: id,
        p_active: active,
        p_reason: reason,
      }),
    );
    revalidateInventory();
    revalidatePath("/configuracion/inventarios");
    return { active };
  });
}

// ── Inventarios y categorías ─────────────────────────────────────────────────

export async function saveInventory(input: unknown) {
  return runAction(inventorySchema, input, async ({ id, branchId, name, description }) => {
    const supabase = await authorize("settings.manage");
    const { error } = id
      ? await supabase.from("inventories").update({ name, description }).eq("id", id)
      : await supabase.from("inventories").insert({ branch_id: branchId, name, description });
    if (error?.code === "23505")
      throw new AppError("DUPLICATE", "Ya existe un inventario con ese nombre.");
    if (error) throw fromPostgrestError(error);
    revalidatePath("/configuracion/inventarios");
    revalidateInventory();
    return { saved: true };
  });
}

export async function saveCategory(input: unknown) {
  return runAction(categorySchema, input, async ({ id, name }) => {
    const supabase = await authorize("settings.manage");
    const { error } = id
      ? await supabase.from("product_categories").update({ name }).eq("id", id)
      : await supabase.from("product_categories").insert({ name });
    if (error?.code === "23505")
      throw new AppError("DUPLICATE", "Ya existe una categoría con ese nombre.");
    if (error) throw fromPostgrestError(error);
    revalidatePath("/configuracion/catalogos");
    revalidateInventory();
    return { saved: true };
  });
}

export async function setCategoryActive(input: unknown) {
  return runAction(
    categorySchema.pick({ id: true }).extend({ active: z.boolean() }),
    input,
    async ({ id, active }) => {
      if (!id) throw new AppError("VALIDATION");
      const supabase = await authorize("settings.manage");
      const { error } = await supabase
        .from("product_categories")
        .update({ is_active: active })
        .eq("id", id);
      if (error) throw fromPostgrestError(error);
      revalidatePath("/configuracion/catalogos");
      return { active };
    },
  );
}
