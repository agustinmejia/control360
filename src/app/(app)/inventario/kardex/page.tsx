import type { Metadata } from "next";
import Link from "next/link";
import { KardexFilters } from "@/components/inventory/kardex-filters";
import { DocumentNumber } from "@/components/inventory/document-badge";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { EmptyState } from "@/components/ui/states";
import { formatDate, isIsoDate } from "@/lib/dates";
import { formatMoney, formatQty } from "@/lib/format";
import { requireUser } from "@/modules/access/session";
import { DOCUMENT_TYPES } from "@/modules/inventory/labels";
import { getCatalog, getKardex, listInventories } from "@/modules/inventory/queries";

export const metadata: Metadata = { title: "Kardex" };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

export default async function KardexPage(props: PageProps<"/inventario/kardex">) {
  await requireUser("/inventario/kardex");
  const params = await props.searchParams;
  const variantId = one(params.variante);
  const inventoryId = one(params.inventario);
  const from = one(params.desde);
  const to = one(params.hasta);
  const validFrom = from && isIsoDate(from) ? from : undefined;
  const validTo = to && isIsoDate(to) ? to : undefined;

  const [catalog, inventories] = await Promise.all([
    getCatalog({ includeInactive: true }),
    listInventories(),
  ]);
  const rows =
    variantId && inventoryId ? await getKardex(variantId, inventoryId, validFrom, validTo) : null;
  const item = catalog.find((c) => c.variant_id === variantId);
  const inventory = inventories.find((i) => i.id === inventoryId);

  // Saldo inicial del período = saldo acumulado antes del primer movimiento mostrado.
  const opening = rows?.length ? Number(rows[0]!.balance) - Number(rows[0]!.signed_quantity) : 0;
  const totalIn =
    rows?.reduce((t, r) => t + (Number(r.direction) > 0 ? Number(r.quantity) : 0), 0) ?? 0;
  const totalOut =
    rows?.reduce((t, r) => t + (Number(r.direction) < 0 ? Number(r.quantity) : 0), 0) ?? 0;
  const closing = rows?.length ? Number(rows[rows.length - 1]!.balance) : opening;
  const unit = item?.unit_symbol ?? undefined;

  return (
    <>
      <PageHeader
        title="Kardex"
        description={
          item && inventory
            ? `${item.display_name} · ${inventory.name}`
            : "Historial de movimientos de un producto en un inventario"
        }
      />
      <KardexFilters
        products={catalog.map((c) => ({
          value: c.variant_id!,
          label: c.display_name!,
          hint: c.sku ?? undefined,
        }))}
        inventories={inventories.map((i) => ({ id: i.id, label: `${i.name} · ${i.branchName}` }))}
        initial={{ variantId, inventoryId, from: validFrom, to: validTo }}
      />
      {!rows ? (
        <EmptyState title="Elige un producto y un inventario" />
      ) : (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-4">
            {[
              ["Saldo inicial del período", opening],
              ["Entradas", totalIn],
              ["Salidas", totalOut],
              ["Saldo final", closing],
            ].map(([label, value]) => (
              <Card key={label as string}>
                <p className="text-muted text-sm">{label}</p>
                <p className="text-xl font-extrabold tabular-nums">
                  {formatQty(value as number, unit)}
                </p>
              </Card>
            ))}
          </div>
          {!rows.length ? (
            <EmptyState title="Sin movimientos en este período" />
          ) : (
            <ResponsiveTable
              caption="Kardex"
              rows={rows}
              rowKey={(r) => String(r.id)}
              columns={[
                { key: "date", header: "Fecha", cell: (r) => formatDate(r.movement_date) },
                {
                  key: "doc",
                  header: "Documento",
                  primary: true,
                  cell: (r) => (
                    <Link
                      href={`/inventario/movimientos/${r.document_id}`}
                      className="text-primary inline-flex flex-wrap items-center gap-2 underline-offset-4 hover:underline"
                    >
                      <span>{DOCUMENT_TYPES[r.document_type!].label}</span>
                      <DocumentNumber type={r.document_type!} number={Number(r.document_number)} />
                      {r.document_status === "voided" && <Badge tone="danger">Anulado</Badge>}
                    </Link>
                  ),
                },
                {
                  key: "detail",
                  header: "Detalle",
                  cell: (r) => r.reason_name ?? r.notes ?? "—",
                  hideOnMobile: true,
                },
                {
                  key: "in",
                  header: "Entrada",
                  align: "right",
                  cell: (r) => (Number(r.direction) > 0 ? formatQty(r.quantity) : ""),
                },
                {
                  key: "out",
                  header: "Salida",
                  align: "right",
                  cell: (r) => (Number(r.direction) < 0 ? formatQty(r.quantity) : ""),
                },
                {
                  key: "balance",
                  header: "Saldo",
                  align: "right",
                  cell: (r) => <strong>{formatQty(r.balance)}</strong>,
                },
                {
                  key: "cost",
                  header: "Costo unit.",
                  align: "right",
                  cell: (r) => formatMoney(r.unit_cost),
                  hideOnMobile: true,
                },
                {
                  key: "user",
                  header: "Usuario",
                  cell: (r) => r.created_by_name ?? "—",
                  hideOnMobile: true,
                },
              ]}
            />
          )}
        </>
      )}
    </>
  );
}
