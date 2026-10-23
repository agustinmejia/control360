import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/layout/back-link";
import { DocumentStatus } from "@/components/inventory/document-badge";
import { VoidDocumentButton } from "@/components/inventory/void-document-button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { businessToday, formatDate, formatDateTime } from "@/lib/dates";
import { formatMoney, formatQty } from "@/lib/format";
import { can } from "@/modules/access/roles";
import { requireUser } from "@/modules/access/session";
import { ADMIN_ONLY_TYPES, DOCUMENT_TYPES, formatDocumentNumber } from "@/modules/inventory/labels";
import { getDocument } from "@/modules/inventory/queries";

export const metadata: Metadata = { title: "Documento de inventario" };

export default async function DocumentPage(props: PageProps<"/inventario/movimientos/[id]">) {
  const user = await requireUser();
  const { id } = await props.params;
  const result = await getDocument(id);
  if (!result) notFound();
  const { doc, lines } = result;
  const type = doc.document_type!;
  const number = formatDocumentNumber(type, Number(doc.number));

  // Misma regla que la base de datos; la BD vuelve a verificar al anular.
  const createdToday = doc.created_at
    ? businessToday(undefined, new Date(doc.created_at)) === businessToday()
    : false;
  const canVoid =
    doc.status === "posted" &&
    type !== "reversal" &&
    !doc.source_type &&
    (can(user.role, "settings.manage") ||
      (user.role === "operator" &&
        doc.created_by === user.id &&
        createdToday &&
        !ADMIN_ONLY_TYPES.includes(type)));

  return (
    <>
      <BackLink href="/inventario/movimientos" label="Movimientos" />
      <PageHeader
        title={`${DOCUMENT_TYPES[type].label} ${number}`}
        description={`${formatDate(doc.document_date)} · ${doc.inventory_name}${doc.target_inventory_name ? ` → ${doc.target_inventory_name}` : ""}`}
        actions={canVoid && <VoidDocumentButton documentId={doc.id!} label={number} />}
      />
      <div className="flex flex-col gap-4">
        <Card>
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted">Estado</dt>
              <dd className="mt-1">
                <DocumentStatus type={type} status={doc.status!} />
              </dd>
            </div>
            <div>
              <dt className="text-muted">Registró</dt>
              <dd>
                {doc.created_by_name} · {doc.created_at && formatDateTime(doc.created_at)}
              </dd>
            </div>
            {doc.reason_name && (
              <div>
                <dt className="text-muted">Motivo</dt>
                <dd>{doc.reason_name}</dd>
              </div>
            )}
            {doc.notes && (
              <div className="sm:col-span-3">
                <dt className="text-muted">Observaciones</dt>
                <dd>{doc.notes}</dd>
              </div>
            )}
            {doc.conversion_loss_base !== null && Number(doc.conversion_loss_base) > 0 && (
              <div>
                <dt className="text-muted">Merma del fraccionamiento</dt>
                <dd>{formatQty(doc.conversion_loss_base)} (en unidad base)</dd>
              </div>
            )}
            {doc.status === "voided" && (
              <div className="sm:col-span-3">
                <dt className="text-muted">Anulado</dt>
                <dd>
                  {doc.voided_at && formatDateTime(doc.voided_at)} · Motivo: {doc.void_reason}
                  {doc.reversed_by_document_id && (
                    <>
                      {" · "}
                      <Link
                        href={`/inventario/movimientos/${doc.reversed_by_document_id}`}
                        className="text-primary underline"
                      >
                        ver documento inverso
                      </Link>
                    </>
                  )}
                </dd>
              </div>
            )}
            {doc.reverses_document_id && (
              <div className="sm:col-span-3">
                <dt className="text-muted">Anula a</dt>
                <dd>
                  <Link
                    href={`/inventario/movimientos/${doc.reverses_document_id}`}
                    className="text-primary underline"
                  >
                    documento {doc.reverses_document_number}
                  </Link>
                </dd>
              </div>
            )}
          </dl>
        </Card>
        <ResponsiveTable
          caption="Productos del documento"
          rows={lines}
          rowKey={(l) => String(l.id)}
          columns={[
            {
              key: "product",
              header: "Producto",
              primary: true,
              cell: (l) => (
                <Link
                  href={`/inventario/kardex?variante=${l.variant_id}&inventario=${l.inventory_id}`}
                  className="text-primary font-semibold underline-offset-4 hover:underline"
                >
                  {l.display_name}
                </Link>
              ),
            },
            { key: "inventory", header: "Inventario", cell: (l) => l.inventory_name },
            {
              key: "qty",
              header: "Cantidad",
              align: "right",
              cell: (l) => (
                <span className={Number(l.direction) > 0 ? "text-primary" : "text-danger"}>
                  {Number(l.direction) > 0 ? "+" : "−"}
                  {formatQty(l.quantity, l.unit_symbol ?? undefined)}
                </span>
              ),
            },
            {
              key: "cost",
              header: "Costo unit.",
              align: "right",
              cell: (l) => formatMoney(l.unit_cost),
            },
          ]}
        />
      </div>
    </>
  );
}
