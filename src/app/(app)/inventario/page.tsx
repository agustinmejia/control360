import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { FilterBar, FilterField } from "@/components/inventory/filter-bar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { EmptyState } from "@/components/ui/states";
import { formatMoney, formatQty } from "@/lib/format";
import { matchesQuery } from "@/lib/text";
import { can } from "@/modules/access/roles";
import { requireUser } from "@/modules/access/session";
import {
  getStock,
  listCategories,
  listInventories,
  type StockRow,
} from "@/modules/inventory/queries";

export const metadata: Metadata = { title: "Existencias" };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

export default async function StockPage(props: PageProps<"/inventario">) {
  const user = await requireUser("/inventario");
  const params = await props.searchParams;
  const inventoryId = one(params.inventario);
  const categoryId = one(params.categoria);
  const q = one(params.q) ?? "";
  const belowMin = one(params.bajo) === "1";

  const [inventories, categories, rows] = await Promise.all([
    listInventories(),
    listCategories(),
    getStock({ inventoryId, categoryId, belowMin }),
  ]);
  const visible = rows.filter((r) => matchesQuery(`${r.display_name} ${r.sku ?? ""}`, q));
  const totalPrice = visible.reduce((t, r) => t + Number(r.value_at_price ?? 0), 0);
  const totalCost = visible.reduce((t, r) => t + Number(r.value_at_cost ?? 0), 0);
  const withoutCost = visible.filter(
    (r) => r.last_unit_cost === null && Number(r.quantity) > 0,
  ).length;
  const lowCount = visible.filter((r) => r.below_min).length;
  const selected = inventories.find((i) => i.id === inventoryId);

  return (
    <>
      <PageHeader
        title="Existencias"
        description={
          selected ? `${selected.name} · ${selected.branchName}` : "Todos los inventarios"
        }
        actions={
          can(user.role, "operations.write") && (
            <Link
              href="/inventario/movimientos/nuevo"
              className="bg-primary text-primary-foreground inline-flex min-h-11 items-center gap-2 rounded-lg px-4 font-semibold"
            >
              <Plus className="size-4" aria-hidden />
              Registrar movimiento
            </Link>
          )
        }
      />
      <FilterBar resetHref="/inventario">
        <FilterField label="Inventario">
          <Select name="inventario" defaultValue={inventoryId ?? ""}>
            <option value="">Todos (stock global)</option>
            {inventories.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} · {i.branchName}
              </option>
            ))}
          </Select>
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
        <FilterField label="Buscar">
          <Input name="q" defaultValue={q} placeholder="Nombre o código" />
        </FilterField>
        <label className="flex min-h-11 items-center gap-3">
          <input
            type="checkbox"
            name="bajo"
            value="1"
            defaultChecked={belowMin}
            className="size-5 accent-[var(--primary)]"
          />
          <span>Solo bajo mínimo</span>
        </label>
      </FilterBar>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Card>
          <p className="text-muted text-sm">Valor a precio de venta</p>
          <p className="text-xl font-extrabold tabular-nums">{formatMoney(totalPrice)}</p>
        </Card>
        <Card>
          <p className="text-muted text-sm">Valor a último costo</p>
          <p className="text-xl font-extrabold tabular-nums">{formatMoney(totalCost)}</p>
          {withoutCost > 0 && (
            <p className="text-muted text-xs">{withoutCost} sin costo conocido</p>
          )}
        </Card>
        <Card>
          <p className="text-muted text-sm">Bajo el mínimo</p>
          <p className={`text-xl font-extrabold ${lowCount ? "text-danger" : ""}`}>{lowCount}</p>
        </Card>
      </div>

      {!visible.length ? (
        <EmptyState
          title="Sin existencias para mostrar"
          description={
            rows.length
              ? "Prueba con otros filtros."
              : "Registra un saldo inicial o una entrada para empezar."
          }
        />
      ) : inventoryId ? (
        <StockTable rows={visible} />
      ) : (
        <GlobalStock rows={visible} />
      )}
    </>
  );
}

function ProductCell({ row }: { row: StockRow }) {
  return (
    <Link
      href={`/inventario/kardex?variante=${row.variant_id}&inventario=${row.inventory_id}`}
      className="text-primary underline-offset-4 hover:underline"
    >
      <span className="block font-semibold">{row.display_name}</span>
      {row.sku && <span className="text-muted block text-xs">{row.sku}</span>}
    </Link>
  );
}

function QuantityCell({
  row,
}: {
  row: Pick<
    StockRow,
    "quantity" | "unit_symbol" | "factor" | "base_quantity" | "base_unit_symbol" | "below_min"
  >;
}) {
  return (
    <span className="inline-flex flex-col items-end">
      <span className="font-semibold">{formatQty(row.quantity, row.unit_symbol ?? undefined)}</span>
      {Number(row.factor) !== 1 && (
        <span className="text-muted text-xs">
          = {formatQty(row.base_quantity, row.base_unit_symbol ?? undefined)}
        </span>
      )}
      {row.below_min && (
        <Badge tone="danger" className="mt-1">
          Bajo mínimo
        </Badge>
      )}
    </span>
  );
}

function StockTable({ rows }: { rows: StockRow[] }) {
  return (
    <ResponsiveTable
      caption="Existencias"
      rows={rows}
      rowKey={(r) => `${r.inventory_id}-${r.variant_id}`}
      columns={[
        { key: "product", header: "Producto", primary: true, cell: (r) => <ProductCell row={r} /> },
        { key: "qty", header: "Existencia", align: "right", cell: (r) => <QuantityCell row={r} /> },
        { key: "min", header: "Mínimo", align: "right", cell: (r) => formatQty(r.min_stock) },
        { key: "price", header: "Precio", align: "right", cell: (r) => formatMoney(r.unit_price) },
        {
          key: "value",
          header: "Valor",
          align: "right",
          cell: (r) => formatMoney(r.value_at_price),
        },
        {
          key: "cost",
          header: "Últ. costo",
          align: "right",
          cell: (r) => formatMoney(r.last_unit_cost),
        },
      ]}
    />
  );
}

/** Stock global: una fila por presentación con el desglose por inventario, y totales por producto. */
function GlobalStock({ rows }: { rows: StockRow[] }) {
  const byVariant = new Map<
    string,
    { row: StockRow; total: number; totalBase: number; parts: StockRow[] }
  >();
  for (const r of rows) {
    const entry = byVariant.get(r.variant_id!) ?? { row: r, total: 0, totalBase: 0, parts: [] };
    entry.total += Number(r.quantity);
    entry.totalBase += Number(r.base_quantity);
    entry.parts.push(r);
    byVariant.set(r.variant_id!, entry);
  }
  const variants = [...byVariant.values()];

  const byProduct = new Map<string, { name: string; unit: string; total: number; count: number }>();
  for (const v of variants) {
    const p = byProduct.get(v.row.product_id!) ?? {
      name: v.row.product_name ?? "",
      unit: v.row.base_unit_symbol ?? "",
      total: 0,
      count: 0,
    };
    p.total += v.totalBase;
    p.count += 1;
    byProduct.set(v.row.product_id!, p);
  }
  const multi = [...byProduct.values()].filter((p) => p.count > 1);

  return (
    <div className="flex flex-col gap-4">
      <ResponsiveTable
        caption="Stock global por presentación"
        rows={variants}
        rowKey={(v) => v.row.variant_id!}
        columns={[
          {
            key: "product",
            header: "Producto",
            primary: true,
            cell: (v) => <span className="font-semibold">{v.row.display_name}</span>,
          },
          {
            key: "total",
            header: "Total",
            align: "right",
            cell: (v) => (
              <QuantityCell
                row={{
                  ...v.row,
                  quantity: v.total,
                  base_quantity: v.totalBase,
                  below_min: v.parts.some((p) => p.below_min),
                }}
              />
            ),
          },
          {
            key: "parts",
            header: "Por inventario",
            cell: (v) => (
              <ul className="flex flex-col gap-0.5 text-sm">
                {v.parts.map((p) => (
                  <li key={p.inventory_id}>
                    <Link
                      href={`/inventario/kardex?variante=${p.variant_id}&inventario=${p.inventory_id}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {p.inventory_name}:{" "}
                      <span className="tabular-nums">
                        {formatQty(p.quantity, p.unit_symbol ?? undefined)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ),
          },
        ]}
      />
      {multi.length > 0 && (
        <Card>
          <h2 className="mb-2 font-semibold">Totales por producto (en unidad base)</h2>
          <ul className="flex flex-col gap-1 text-sm">
            {multi.map((p) => (
              <li key={p.name} className="flex justify-between gap-3">
                <span>{p.name}</span>
                <span className="font-semibold tabular-nums">{formatQty(p.total, p.unit)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
