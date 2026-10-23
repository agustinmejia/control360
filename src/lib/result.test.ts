import { describe, expect, it } from "vitest";
import { z } from "zod";
import { AppError, fromPostgrestError } from "./errors";
import { runAction } from "./result";

const schema = z.object({ name: z.string().min(1, "El nombre es obligatorio") });

describe("runAction", () => {
  it("devuelve errores de campo en español si la validación falla", async () => {
    const result = await runAction(schema, { name: "" }, async () => "no se ejecuta");
    expect(result).toEqual({
      ok: false,
      error: {
        code: "VALIDATION",
        message: "Revisa los datos marcados.",
        fieldErrors: { name: ["El nombre es obligatorio"] },
      },
    });
  });

  it("devuelve los datos si todo sale bien", async () => {
    const result = await runAction(schema, { name: "Sal" }, async ({ name }) => name.toUpperCase());
    expect(result).toEqual({ ok: true, data: "SAL" });
  });

  it("convierte AppError en un resultado sin lanzar", async () => {
    const result = await runAction(schema, { name: "x" }, async () => {
      throw new AppError("INSUFFICIENT_STOCK");
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("INSUFFICIENT_STOCK");
  });

  it("oculta los detalles de errores inesperados", async () => {
    const result = await runAction(schema, { name: "x" }, async () => {
      throw new Error("detalle interno");
    });
    expect(result).toMatchObject({ ok: false, error: { code: "UNEXPECTED" } });
  });
});

describe("fromPostgrestError", () => {
  it("usa el código de dominio indicado en el hint", () => {
    expect(fromPostgrestError({ code: "P0001", hint: "INSUFFICIENT_STOCK" }).code).toBe(
      "INSUFFICIENT_STOCK",
    );
  });
  it("traduce violaciones de unicidad y permisos", () => {
    expect(fromPostgrestError({ code: "23505" }).code).toBe("DUPLICATE");
    expect(fromPostgrestError({ code: "42501" }).code).toBe("FORBIDDEN");
  });
});
