import { unstable_rethrow } from "next/navigation";
import { z } from "@/lib/validation";
import { AppError, ERROR_MESSAGES, type ErrorCode, type FieldErrors } from "@/lib/errors";
import { logger } from "@/lib/logger";

/** Resultado tipado que devuelven todas las Server Actions. */
export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: ErrorCode; message: string; fieldErrors?: FieldErrors } };

export const ok = <T>(data: T): Result<T> => ({ ok: true, data });

export function fail(code: ErrorCode, message?: string, fieldErrors?: FieldErrors): Result<never> {
  return { ok: false, error: { code, message: message ?? ERROR_MESSAGES[code], fieldErrors } };
}

export function fieldErrorsFromZod(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

/**
 * Envuelve la lógica de una Server Action: valida la entrada con Zod y convierte
 * cualquier excepción en un `Result` sin filtrar detalles internos al cliente.
 */
export async function runAction<S extends z.ZodType, T>(
  schema: S,
  input: unknown,
  handler: (data: z.infer<S>) => Promise<T>,
): Promise<Result<T>> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return fail("VALIDATION", undefined, fieldErrorsFromZod(parsed.error));
  try {
    return ok(await handler(parsed.data));
  } catch (error) {
    unstable_rethrow(error); // redirect(), notFound(), etc. deben llegar a Next.js
    if (error instanceof AppError) return fail(error.code, error.message, error.fieldErrors);
    logger.error("Error no controlado en una acción", { error });
    return fail("UNEXPECTED");
  }
}
