/**
 * Fechas de negocio: se manejan como texto "YYYY-MM-DD" en la zona horaria de la empresa,
 * nunca como `Date` local del dispositivo (corrige H-16 del prototipo).
 */
export const DEFAULT_TIME_ZONE = "America/La_Paz";

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Fecha de hoy en la zona horaria indicada, como "YYYY-MM-DD". */
export function businessToday(timeZone = DEFAULT_TIME_ZONE, now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function isIsoDate(value: string): boolean {
  const m = ISO_DATE.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
}

/** "2026-10-23" → "23/10/2026" sin conversiones de zona horaria. */
export function formatDate(isoDate: string | null | undefined): string {
  if (!isoDate || !isIsoDate(isoDate)) return "—";
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

/** Marca de tiempo (timestamptz) → "23/10/2026 14:05" en la zona de la empresa. */
export function formatDateTime(value: string | Date, timeZone = DEFAULT_TIME_ZONE): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-BO", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(date)
    .replace(",", "");
}
