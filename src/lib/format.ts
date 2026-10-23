/**
 * Formatos de Bolivia: "Bs 1.234,50", coma decimal y punto de miles.
 * Los totales oficiales los calcula la base de datos; estas funciones solo presentan.
 */
const LOCALE = "es-BO";

const moneyFormatter = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const qtyFormatter = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 3 });

type Numeric = number | string | null | undefined;

function toNumber(value: Numeric): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function formatMoney(value: Numeric, currencySymbol = "Bs"): string {
  const n = toNumber(value);
  if (n === null) return "—";
  return `${currencySymbol} ${moneyFormatter.format(n)}`;
}

export function formatQty(value: Numeric, unit?: string): string {
  const n = toNumber(value);
  if (n === null) return "—";
  return unit ? `${qtyFormatter.format(n)} ${unit}` : qtyFormatter.format(n);
}

/**
 * Convierte lo que escribe el usuario ("1.234,50", "1234.5", "12,5") en un decimal
 * normalizado como texto ("1234.50"), o `null` si no es válido.
 * - Con coma y punto: el último separador es el decimal; el otro, de miles.
 * - Solo coma: una coma es decimal; varias, inválido.
 * - Solo punto: varios puntos son de miles; uno es decimal, salvo que le sigan
 *   exactamente 3 dígitos y se admitan menos decimales ("1.234" en dinero = 1234).
 */
export function parseDecimalInput(raw: string, maxDecimals = 2): string | null {
  const text = raw.trim().replace(/\s/g, "");
  if (!/^-?\d[\d.,]*$/.test(text)) return null;

  const commas = text.split(",").length - 1;
  const dots = text.split(".").length - 1;
  let intPart: string;
  let decPart = "";

  if (commas > 0 && dots > 0) {
    const decimalSep = text.lastIndexOf(",") > text.lastIndexOf(".") ? "," : ".";
    const thousandsSep = decimalSep === "," ? "." : ",";
    if (text.split(decimalSep).length - 1 > 1) return null;
    [intPart, decPart = ""] = text.replaceAll(thousandsSep, "").split(decimalSep) as [
      string,
      string?,
    ];
  } else if (commas > 0) {
    if (commas > 1) return null;
    [intPart, decPart = ""] = text.split(",") as [string, string?];
  } else if (dots > 1) {
    intPart = text.replaceAll(".", "");
  } else if (dots === 1) {
    const [a, b = ""] = text.split(".") as [string, string?];
    if (b.length === 3 && maxDecimals < 3) intPart = a + b;
    else [intPart, decPart] = [a, b];
  } else {
    intPart = text;
  }

  if (!/^-?\d+$/.test(intPart) || !/^\d*$/.test(decPart) || decPart.length > maxDecimals) {
    return null;
  }
  const normalizedInt = intPart.replace(/^(-?)0+(?=\d)/, "$1");
  return maxDecimals === 0 ? normalizedInt : `${normalizedInt}.${decPart.padEnd(maxDecimals, "0")}`;
}
