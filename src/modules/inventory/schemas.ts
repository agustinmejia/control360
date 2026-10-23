import { parseDecimalInput } from "@/lib/format";
import { isIsoDate } from "@/lib/dates";
import { z } from "@/lib/validation";

const uuid = z.uuid("Elige una opción");
const date = z.string().refine(isIsoDate, "Elige una fecha válida");
const notes = z.string().trim().max(500, "Máximo 500 caracteres").optional();
const requestId = z.uuid();

/** Texto escrito por el usuario → decimal normalizado ("1.234,5" → "1234.500"). */
const decimal = (maxDecimals: number, { allowZero = false, required = true } = {}) =>
  z.string().transform((value, ctx) => {
    if (!value.trim() && !required) return null;
    const parsed = parseDecimalInput(value, maxDecimals);
    if (parsed === null || Number(parsed) < 0 || (!allowZero && Number(parsed) === 0)) {
      ctx.addIssue({
        code: "custom",
        message: allowZero ? "Escribe una cantidad válida" : "Escribe un número mayor a 0",
      });
      return z.NEVER;
    }
    return parsed;
  });

const quantity = decimal(3);
const optionalCost = decimal(4, { allowZero: true, required: false });

const qtyLine = z.object({ variantId: uuid, quantity });
const costLine = qtyLine.extend({ unitCost: optionalCost });
const countLine = z.object({ variantId: uuid, counted: decimal(3, { allowZero: true }) });

const lines = <T extends z.ZodType>(line: T) => z.array(line).min(1, "Agrega al menos un producto");

const base = { date, notes, requestId };

export const openingSchema = z.object({
  ...base,
  type: z.literal("opening"),
  inventoryId: uuid,
  lines: lines(costLine),
});
export const entrySchema = z.object({
  ...base,
  type: z.literal("entry"),
  inventoryId: uuid,
  reasonId: uuid,
  lines: lines(costLine),
});
export const exitSchema = z.object({
  ...base,
  type: z.literal("exit"),
  inventoryId: uuid,
  reasonId: uuid,
  lines: lines(qtyLine),
});
export const adjustmentSchema = z.object({
  ...base,
  type: z.literal("adjustment"),
  inventoryId: uuid,
  reasonId: uuid,
  lines: lines(countLine),
});
export const transferSchema = z
  .object({
    ...base,
    type: z.literal("transfer"),
    inventoryId: uuid,
    targetInventoryId: uuid,
    lines: lines(qtyLine),
  })
  .refine((v) => v.inventoryId !== v.targetInventoryId, {
    path: ["targetInventoryId"],
    message: "Elige un inventario distinto del de origen",
  });
export const conversionSchema = z
  .object({
    ...base,
    type: z.literal("conversion"),
    inventoryId: uuid,
    fromVariantId: uuid,
    fromQuantity: quantity,
    toVariantId: uuid,
    toQuantity: quantity,
  })
  .refine((v) => v.fromVariantId !== v.toVariantId, {
    path: ["toVariantId"],
    message: "Elige una presentación distinta",
  });

export const documentSchema = z.union([
  openingSchema,
  entrySchema,
  exitSchema,
  adjustmentSchema,
  transferSchema,
  conversionSchema,
]);
export type DocumentInput = z.input<typeof documentSchema>;

export const voidDocumentSchema = z.object({
  documentId: z.uuid(),
  reason: z.string().trim().min(3, "Indica el motivo (mínimo 3 caracteres)").max(300),
});

// ── Catálogo ─────────────────────────────────────────────────────────────────

const money = decimal(2, { allowZero: true });
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres`)
    .transform((v) => v || null);

export const productSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(2, "Escribe el nombre").max(120, "Máximo 120 caracteres"),
  categoryId: z.union([z.uuid(), z.literal("")]).transform((v) => v || null),
  description: optionalText(500),
});
export const newProductSchema = productSchema.extend({
  baseUnitId: uuid,
  sku: optionalText(40),
  basePrice: money,
  minStock: decimal(3, { allowZero: true }),
});
export type NewProductInput = z.input<typeof newProductSchema>;

export const variantSchema = z.object({
  id: z.uuid().optional(),
  productId: z.uuid(),
  name: z.string().trim().min(1, "Escribe el nombre").max(80, "Máximo 80 caracteres"),
  unitId: uuid.optional(),
  factor: decimal(6).optional(),
  sku: optionalText(40),
  minStock: decimal(3, { allowZero: true }),
});
export type VariantInput = z.input<typeof variantSchema>;

export const priceSchema = z.object({
  variantId: z.uuid(),
  inventoryId: z.uuid().optional(),
  price: decimal(2, { allowZero: true, required: false }),
  reason: z.string().trim().max(200).optional(),
});
export type PriceInput = z.input<typeof priceSchema>;

export const activeSchema = z
  .object({
    entity: z.enum(["product", "variant", "inventory"]),
    id: z.uuid(),
    active: z.boolean(),
    reason: z.string().trim().optional(),
  })
  .refine((v) => v.active || (v.reason?.length ?? 0) >= 3, {
    path: ["reason"],
    message: "Indica el motivo (mínimo 3 caracteres)",
  });

export const inventorySchema = z.object({
  id: z.uuid().optional(),
  branchId: uuid,
  name: z.string().trim().min(2, "Escribe el nombre").max(80, "Máximo 80 caracteres"),
  description: optionalText(300),
});
export type InventoryInput = z.input<typeof inventorySchema>;

export const categorySchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(2, "Escribe el nombre").max(60, "Máximo 60 caracteres"),
});
