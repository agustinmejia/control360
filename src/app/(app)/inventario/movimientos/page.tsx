import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { DocumentNumber, DocumentStatus } from "@/components/inventory/document-badge";
import { FilterBar, FilterField } from "@/components/inventory/filter-bar";
import { Input, Select } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { EmptyState } from "@/components/ui/states";
import { formatDate, isIsoDate } from "@/lib/dates";
import { can } from "@/modules/access/roles";
import { requireUser } from "@/modules/access/session";
import {
  DOCUMENT_TYPES,
  documentTypeFromSlug,
  type DocumentType,
} from "@/modules/inventory/labels";
import { listDocuments, listInventories } from "@/modules/inventory/queries";

export const metadata: Metadata = { title: "Movimientos de inventario" };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

export default async function MovementsPage(props: PageProps<"/inventario/movimientos">) {
  const user = await requireUser("/inventario/movimientos");
  const params = await props.searchParams;
  const inventoryId = one(params.inventario);
  const type =
    documentTypeFromSlug(one(params.tipo)) ??
    (one(params.tipo) === "anulacion" ? "reversal" : undefined);
  const from = one(params.desde);
  const to = one(params.hasta);

  const [inventories, docs] = await Promise.all([
    listInventories(),
    listDocuments({
      inventoryId,
      type,
      from: from && isIsoDate(from) ? from : undefined,
      to: to && isIsoDate(to) ? to : undefined,
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Movimientos"
        description="Entradas, salidas, ajustes, traspasos y fraccionamientos. Nada se borra: se anula."
        actions={
          can(user.role, "operations.write") && (
            <Link
              href="/inventario/movimientos/nuevo"
              className="bg-primary text-primary-foreground inline-flex min-h-11 items-center gap-2 rounded-lg px-4 font-semibold"
            >
              <Plus className="size-4" aria-hidden />
              Registrar
            </Link>
          )
        }
      />
      <FilterBar resetHref="/inventario/movimientos">
        <FilterField label="Inventario">
          <Select name="inventario" defaultValue={inventoryId ?? ""}>
            <option value="">Todos</option>
            {inventories.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </Select>
        </FilterField>
        <FilterField label="Tipo">
          <Select name="tipo" defaultValue={type ? DOCUMENT_TYPES[type].slug : ""}>
            <option value="">Todos</option>
            {(Object.keys(DOCUMENT_TYPES) as DocumentType[]).map((t) => (
              <option key={t} value={DOCUMENT_TYPES[t].slug}>
                {DOCUMENT_TYPES[t].label}
              </option>
            ))}
          </Select>
        </FilterField>
        <FilterField label="Desde">
          <Input type="date" name="desde" defaultValue={from} />
        </FilterField>
        <FilterField label="Hasta">
          <Input type="date" name="hasta" defaultValue={to} />
        </FilterField>
      </FilterBar>

      {!docs.length ? (
        <EmptyState
          title="Sin movimientos"
          description="Los documentos registrados aparecerán aquí."
        />
      ) : (
        <ResponsiveTable
          caption="Documentos de inventario"
          rows={docs}
          rowKey={(d) => d.id!}
          columns={[
            {
              key: "number",
              header: "Documento",
              primary: true,
              cell: (d) => (
                <Link
                  href={`/inventario/movimientos/${d.id}`}
                  className="text-primary inline-flex flex-wrap items-center gap-2 underline-offset-4 hover:underline"
                >
                  <DocumentNumber type={d.document_type!} number={Number(d.number)} />
                  <DocumentStatus type={d.document_type!} status={d.status!} />
                </Link>
              ),
            },
            { key: "date", header: "Fecha", cell: (d) => formatDate(d.document_date) },
            {
              key: "inventory",
              header: "Inventario",
              cell: (d) =>
                d.target_inventory_name
                  ? `${d.inventory_name} → ${d.target_inventory_name}`
                  : d.inventory_name,
            },
            {
              key: "reason",
              header: "Motivo / detalle",
              cell: (d) => d.reason_name ?? d.notes ?? "—",
            },
            {
              key: "lines",
              header: "Productos",
              align: "right",
              cell: (d) =>
                d.document_type === "transfer" ? Number(d.movement_count) / 2 : d.movement_count,
            },
            { key: "user", header: "Registró", cell: (d) => d.created_by_name ?? "—" },
          ]}
        />
      )}
    </>
  );
}
