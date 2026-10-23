import { describe, expect, it } from "vitest";
import { conversionSchema, exitSchema, newProductSchema, transferSchema } from "./schemas";

const id = (n: number) => `0000000${n}-0000-4000-8000-000000000000`;
const base = { date: "2026-10-23", requestId: id(9) };

describe("documentos", () => {
  it("normaliza cantidades escritas con coma", () => {
    const parsed = exitSchema.parse({
      ...base,
      type: "exit",
      inventoryId: id(1),
      reasonId: id(2),
      lines: [{ variantId: id(3), quantity: "2,5" }],
    });
    expect(parsed.lines[0]?.quantity).toBe("2.500");
  });
  it("exige al menos una línea y cantidades positivas", () => {
    expect(
      exitSchema.safeParse({
        ...base,
        type: "exit",
        inventoryId: id(1),
        reasonId: id(2),
        lines: [],
      }).success,
    ).toBe(false);
    expect(
      exitSchema.safeParse({
        ...base,
        type: "exit",
        inventoryId: id(1),
        reasonId: id(2),
        lines: [{ variantId: id(3), quantity: "0" }],
      }).success,
    ).toBe(false);
  });
  it("el traspaso exige destino distinto", () => {
    const r = transferSchema.safeParse({
      ...base,
      type: "transfer",
      inventoryId: id(1),
      targetInventoryId: id(1),
      lines: [{ variantId: id(3), quantity: "1" }],
    });
    expect(r.success).toBe(false);
  });
  it("el fraccionamiento exige presentaciones distintas", () => {
    const r = conversionSchema.safeParse({
      ...base,
      type: "conversion",
      inventoryId: id(1),
      fromVariantId: id(3),
      fromQuantity: "1",
      toVariantId: id(3),
      toQuantity: "40",
    });
    expect(r.success).toBe(false);
  });
});

describe("productos", () => {
  it("convierte precio y categoría vacía", () => {
    const parsed = newProductSchema.parse({
      name: "Sal",
      categoryId: "",
      description: "",
      baseUnitId: id(1),
      sku: "",
      basePrice: "185,5",
      minStock: "0",
    });
    expect(parsed).toMatchObject({
      categoryId: null,
      sku: null,
      basePrice: "185.50",
      minStock: "0.000",
    });
  });
});
