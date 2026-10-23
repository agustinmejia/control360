"use server";

import { formatMoney } from "@/lib/format";
import { AppError } from "@/lib/errors";
import { runAction } from "@/lib/result";
import { demoSchema } from "./schema";

/** Ejemplo del patrón de mutación: validar con Zod → lógica → `Result` tipado. */
export async function demoAction(input: unknown) {
  return runAction(demoSchema, input, async (data) => {
    if (data.product.toLowerCase() === "error") {
      throw new AppError("INSUFFICIENT_STOCK");
    }
    return {
      message: `${data.product}: ${formatMoney(data.price)} por ${data.unit} (${data.date})`,
    };
  });
}
