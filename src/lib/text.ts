/** Normaliza texto para búsquedas: minúsculas y sin tildes ("Ñandú" → "nandu"). */
export function normalizeText(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/** ¿Contiene `text` todas las palabras de `query`, en cualquier orden? */
export function matchesQuery(text: string, query: string): boolean {
  const haystack = normalizeText(text);
  return normalizeText(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}
