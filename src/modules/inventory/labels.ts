import type { Database } from "@/lib/supabase/database.types";

export type DocumentType = Database["public"]["Enums"]["inv_document_type"];

export const DOCUMENT_TYPES: Record<
  DocumentType,
  { label: string; prefix: string; slug: string; verb: string; description: string }
> = {
  opening: {
    label: "Saldo inicial",
    prefix: "SI",
    slug: "inicial",
    verb: "Registrar saldo inicial",
    description: "Existencias con las que empieza un producto en un inventario.",
  },
  entry: {
    label: "Entrada",
    prefix: "EN",
    slug: "entrada",
    verb: "Registrar entrada",
    description: "Ingreso que no es compra: devolución, donación recibida…",
  },
  exit: {
    label: "Salida",
    prefix: "SA",
    slug: "salida",
    verb: "Registrar salida",
    description: "Salida que no es venta: consumo interno, merma, envío a predio…",
  },
  adjustment: {
    label: "Ajuste",
    prefix: "AJ",
    slug: "ajuste",
    verb: "Registrar ajuste",
    description: "Corrige el sistema según un conteo físico.",
  },
  transfer: {
    label: "Traspaso",
    prefix: "TR",
    slug: "traspaso",
    verb: "Registrar traspaso",
    description: "Mueve mercadería de un inventario a otro.",
  },
  conversion: {
    label: "Fraccionamiento",
    prefix: "FR",
    slug: "fraccionamiento",
    verb: "Registrar fraccionamiento",
    description: "Abre una presentación en otra del mismo producto (saco → kg).",
  },
  reversal: {
    label: "Anulación",
    prefix: "AN",
    slug: "anulacion",
    verb: "",
    description: "Documento inverso que anula otro.",
  },
};

/** Tipos que un usuario puede registrar desde la pantalla de movimientos. */
export const CREATABLE_TYPES: DocumentType[] = [
  "entry",
  "exit",
  "transfer",
  "conversion",
  "adjustment",
  "opening",
];

/** Solo propietario y administrador (igual que en la base de datos). */
export const ADMIN_ONLY_TYPES: DocumentType[] = ["opening", "adjustment"];

export function documentTypeFromSlug(slug: string | undefined): DocumentType | undefined {
  return (
    Object.entries(DOCUMENT_TYPES) as [DocumentType, (typeof DOCUMENT_TYPES)[DocumentType]][]
  ).find(([type, info]) => info.slug === slug && type !== "reversal")?.[0];
}

export function formatDocumentNumber(type: DocumentType, number: number | bigint): string {
  return `${DOCUMENT_TYPES[type].prefix}-${String(number).padStart(4, "0")}`;
}
