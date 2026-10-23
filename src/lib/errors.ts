/**
 * Catálogo de errores de dominio. El código viaja entre servidor y cliente;
 * el mensaje es el texto en español que ve el usuario.
 */
export const ERROR_MESSAGES = {
  VALIDATION: "Revisa los datos marcados.",
  UNAUTHENTICATED: "Tu sesión expiró. Vuelve a iniciar sesión.",
  FORBIDDEN: "No tienes permiso para realizar esta acción.",
  NOT_FOUND: "No encontramos lo que buscas.",
  CONFLICT: "Otra persona modificó este registro. Recarga e inténtalo de nuevo.",
  DUPLICATE: "Ya existe un registro con esos datos.",
  INSUFFICIENT_STOCK: "No hay existencias suficientes.",
  NETWORK: "No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.",
  UNEXPECTED: "Ocurrió un error inesperado. Inténtalo de nuevo.",
} as const;

export type ErrorCode = keyof typeof ERROR_MESSAGES;

export type FieldErrors = Record<string, string[]>;

export class AppError extends Error {
  override name = "AppError";
  constructor(
    public readonly code: ErrorCode,
    message?: string,
    public readonly fieldErrors?: FieldErrors,
  ) {
    super(message ?? ERROR_MESSAGES[code]);
  }
}

/**
 * Traduce errores de PostgreSQL/PostgREST a códigos de dominio.
 * Las funciones de negocio en la BD lanzan `raise exception using errcode = 'P0001',
 * hint = '<ERROR_CODE>'` para elegir el código explícitamente.
 */
export function fromPostgrestError(error: {
  code?: string;
  message?: string;
  hint?: string | null;
}): AppError {
  if (error.hint && error.hint in ERROR_MESSAGES) {
    return new AppError(error.hint as ErrorCode, error.message);
  }
  switch (error.code) {
    case "23505":
      return new AppError("DUPLICATE");
    case "23503":
    case "23514":
    case "22P02":
      return new AppError("VALIDATION");
    case "42501":
      return new AppError("FORBIDDEN");
    case "PGRST116":
      return new AppError("NOT_FOUND");
    case "PGRST301":
      return new AppError("UNAUTHENTICATED");
    default:
      return new AppError("UNEXPECTED");
  }
}
