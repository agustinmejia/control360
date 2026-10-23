import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { FilterBar, FilterField } from "@/components/inventory/filter-bar";
import { Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { EmptyState } from "@/components/ui/states";
import { formatMoney, formatQty } from "@/lib/format";
import { matchesQuery } from "@/lib/text";
import { can } from "@/modules/access/roles";
import { requireUser } from "@/modules/access/session";
import { getCatalog, listCategories } from "@/modules/inventory/queries";

export const metadata: Metadata = { title: "Productos" };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

export default async function ProductsPage(props: PageProps<"/inventario/productos">) {
  const user = await requireUser("/inventario/productos");
  const params = await props.searchParams;
  const q = one(params.q) ?? "";
  const categoryId = one(params.categoria);
  const showInactive = one(params.inactivos) === "1";
  const [catalog, categories] = await Promise.all([
    getCatalog({ includeInactive: showInactive }),
    listCategories(),
  ]);
  const rows = catalog.filter(
    (c) =>
      (!categoryId || c.category_id === categoryId) &&
      matchesQuery(`${c.display_name} ${c.sku ?? ""}`, q),
  );

  return (
    <>
      <PageHeader
        title="Productos"
        description="Catálogo con sus presentaciones y precios base."
        actions={
          can(user.role, "settings.manage") && (
            <Link
              href="/inventario/productos/nuevo"
              className="bg-primary text-primary-foreground inline-flex min-h-11 items-center gap-2 rounded-lg px-4 font-semibold"
            >
              <Plus className="size-4" aria-hidden />
              Nuevo producto
            </Link>
          )
        }
      />
      <FilterBar resetHref="/inventario/productos">
        <FilterField label="Buscar">
          <Input name="q" defaultValue={q} placeholder="Nombre o código" />
        </FilterField>
        <FilterField label="Categoría">
          <Select name="categoria" defaultValue={categoryId ?? ""}>
            <option value="">Todas</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </FilterField>
        <label className="flex min-h-11 items-center gap-3">
          <input
            type="checkbox"
            name="inactivos"
            value="1"
            defaultChecked={showInactive}
            className="size-5 accent-[var(--primary)]"
          />
          <span>Incluir desactivados</span>
        </label>
      </FilterBar>
      {!rows.length ? (
        <EmptyState
          title="Sin productos"
          description={
            catalog.length ? "Prueba con otros filtros." : "Crea el primer producto del catálogo."
          }
        />
      ) : (
        <ResponsiveTable
          caption="Catálogo"
          rows={rows}
          rowKey={(c) => c.variant_id!}
          columns={[
            {
              key: "name",
              header: "Producto",
              primary: true,
              cell: (c) => (
                <Link
                  href={`/inventario/productos/${c.product_id}`}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  <span className="block font-semibold">{c.display_name}</span>
                  {c.sku && <span className="text-muted block text-xs">{c.sku}</span>}
                </Link>
              ),
            },
            { key: "category", header: "Categoría", cell: (c) => c.category_name ?? "—" },
            {
              key: "unit",
              header: "Presentación",
              cell: (c) =>
                Number(c.factor) === 1
                  ? c.unit_symbol
                  : `1 ${c.unit_symbol} = ${formatQty(c.factor, c.base_unit_symbol ?? undefined)}`,
            },
            {
              key: "price",
              header: "Precio base",
              align: "right",
              cell: (c) => formatMoney(c.base_price),
            },
            {
              key: "status",
              header: "Estado",
              cell: (c) =>
                c.is_active ? (
                  <Badge tone="success">Activo</Badge>
                ) : (
                  <Badge tone="danger">Desactivado</Badge>
                ),
            },
          ]}
        />
      )}
    </>
  );
}
