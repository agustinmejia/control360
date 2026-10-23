import { z } from "@/lib/validation";
import { parseDecimalInput } from "@/lib/format";
import { isIsoDate } from "@/lib/dates";

/** Esquema compartido entre el formulario (cliente) y la Server Action (servidor). */
export const demoSchema = z.object({
  product: z.string().trim().min(2, "Escribe al menos 2 caracteres"),
  price: z.string().transform((v, ctx) => {
    const parsed = parseDecimalInput(v, 2);
    if (parsed === null || Number(parsed) <= 0) {
      ctx.addIssue({ code: "custom", message: "Escribe un precio mayor a 0 (ej.: 1.250,50)" });
      return z.NEVER;
    }
    return parsed;
  }),
  date: z.string().refine(isIsoDate, "Elige una fecha válida"),
  unit: z.enum(["unidad", "kg", "saco"], { message: "Elige una unidad" }),
});

export type DemoInput = z.input<typeof demoSchema>;
