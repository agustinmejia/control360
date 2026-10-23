/**
 * Registro técnico mínimo y estructurado (JSON por línea), legible en los logs de Vercel.
 * No registrar datos personales ni secretos: solo identificadores y códigos.
 */
type Level = "debug" | "info" | "warn" | "error";
type Context = Record<string, unknown>;

const SENSITIVE_KEYS = /pass(word)?|token|secret|key|authorization|cookie/i;

function serializeError(error: unknown) {
  if (error instanceof Error)
    return { name: error.name, message: error.message, stack: error.stack };
  return error;
}

export function redact(context: Context): Context {
  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => {
      if (SENSITIVE_KEYS.test(key)) return [key, "[redactado]"];
      if (key === "error") return [key, serializeError(value)];
      return [key, value];
    }),
  );
}

function write(level: Level, message: string, context: Context = {}) {
  if (level === "debug" && process.env.NODE_ENV === "production") return;
  const entry = JSON.stringify({
    level,
    message,
    time: new Date().toISOString(),
    ...redact(context),
  });
  if (level === "error") console.error(entry);
  else if (level === "warn") console.warn(entry);
  else console.log(entry);
}

export const logger = {
  debug: (message: string, context?: Context) => write("debug", message, context),
  info: (message: string, context?: Context) => write("info", message, context),
  warn: (message: string, context?: Context) => write("warn", message, context),
  error: (message: string, context?: Context) => write("error", message, context),
};
