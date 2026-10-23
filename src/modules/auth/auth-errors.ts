import { AppError } from "@/lib/errors";

/** Traduce errores de Supabase Auth a mensajes en español sin revelar si una cuenta existe. */
export function fromAuthError(error: {
  code?: string;
  status?: number;
  message?: string;
}): AppError {
  switch (error.code) {
    case "invalid_credentials":
    case "user_not_found":
      return new AppError("VALIDATION", "Correo o contraseña incorrectos.");
    case "user_banned":
      return new AppError(
        "FORBIDDEN",
        "Tu cuenta está desactivada. Consulta con el administrador.",
      );
    case "email_not_confirmed":
      return new AppError(
        "VALIDATION",
        "Tu correo aún no está confirmado. Revisa tu bandeja de entrada.",
      );
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return new AppError(
        "CONFLICT",
        "Demasiados intentos. Espera unos minutos y vuelve a intentarlo.",
      );
    case "weak_password":
      return new AppError(
        "VALIDATION",
        "La contraseña es muy débil: usa al menos 8 caracteres con letras y números.",
      );
    case "same_password":
      return new AppError("VALIDATION", "La nueva contraseña debe ser distinta de la anterior.");
    case "session_not_found":
    case "refresh_token_not_found":
      return new AppError("UNAUTHENTICATED");
    default:
      return error.status === 0 ? new AppError("NETWORK") : new AppError("UNEXPECTED");
  }
}
