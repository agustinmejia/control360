import { Badge } from "@/components/ui/badge";
import {
  DOCUMENT_TYPES,
  formatDocumentNumber,
  type DocumentType,
} from "@/modules/inventory/labels";

export function DocumentNumber({ type, number }: { type: DocumentType; number: number }) {
  return <span className="font-mono text-sm">{formatDocumentNumber(type, number)}</span>;
}

export function DocumentStatus({ status, type }: { status: string; type: DocumentType }) {
  if (status === "voided") return <Badge tone="danger">Anulado</Badge>;
  if (type === "reversal") return <Badge tone="warning">Anulación</Badge>;
  return <Badge tone="neutral">{DOCUMENT_TYPES[type].label}</Badge>;
}
