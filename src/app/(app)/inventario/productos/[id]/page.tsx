import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/layout/back-link";
import {
  CatalogActiveToggle,
  PriceForm,
  ProductForm,
  VariantForm,
} from "@/components/inventory/product-forms";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { formatDateTime } from "@/lib/dates";
import { formatMoney, formatQty } from "@/lib/format";
import { can } from "@/modules/access/roles";
import { requireUser } from "@/modules/access/session";
import {
  getProduct,
  listCategories,
  listInventories,
  listUnits,
} from "@/modules/inventory/queries";

export const metadata: Metadata = { title: "Producto" };

export default async function ProductPage(props: PageProps<"/inventario/productos/[id]">) {
  const user = await requireUser();
  const { id } = await props.params;
  const [data, categories, units, inventories] = await Promise.all([
    getProduct(id),
    listCategories(),
    listUnits(),
    listInventories(),
  ]);
  if (!data) notFound();
  const { product, variants, prices, history } = data;
  const admin = can(user.role, "settings.manage");
  const baseUnit = product.units?.symbol ?? "";
  const inventoryName = new Map(inventories.map((i) => [i.id, i.name]));
  const variantName = new Map(variants.map((v) => [v.id, v.name]));

  return (
    <>
      <BackLink href="/inventario/productos" label="Productos" />
      <PageHeader
        title={product.name}
        description={`Unidad base: ${product.units?.name} · ${product.product_categories?.name ?? "Sin categoría"}`}
        actions={!product.is_active && <Badge tone="danger">Desactivado</Badge>}
      />
      <div className="flex flex-col gap-4">
        {admin && (
          <Card>
            <CardTitle>Datos del producto</CardTitle>
            <ProductForm
              product={{
                id: product.id,
                name: product.name,
                categoryId: product.category_id,
                description: product.description,
              }}
              categories={categories}
            />
          </Card>
        )}

        <section aria-labelledby="presentaciones" className="flex flex-col gap-3">
          <h2 id="presentaciones" className="text-lg font-semibold">
            Presentaciones
          </h2>
          {variants.map((v) => (
            <Card key={v.id} className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold">{v.name}</h3>
                {v.is_default && <Badge>Por defecto</Badge>}
                {!v.is_active && <Badge tone="danger">Desactivada</Badge>}
                <span className="text-muted text-sm">
                  {Number(v.factor) === 1
                    ? `Unidad: ${v.units?.name}`
                    : `1 ${v.units?.symbol} = ${formatQty(v.factor, baseUnit)}`}
                  {v.sku && ` · Código ${v.sku}`} · Precio base {formatMoney(v.base_price)}
                </span>
              </div>
              {admin && (
                <>
                  <VariantForm
                    productId={product.id}
                    baseUnitSymbol={baseUnit}
                    variant={{ id: v.id, name: v.name, sku: v.sku, minStock: Number(v.min_stock) }}
                  />
                  <PriceForm variantId={v.id} price={Number(v.base_price)} label="Precio base" />
                  {inventories.length > 0 && (
                    <details>
                      <summary className="text-primary cursor-pointer font-medium">
                        Precios por inventario
                      </summary>
                      <div className="mt-3 flex flex-col gap-3">
                        {inventories.map((inv) => {
                          const own = prices.find(
                            (p) => p.inventory_id === inv.id && p.variant_id === v.id,
                          )?.price;
                          return (
                            <PriceForm
                              key={inv.id}
                              variantId={v.id}
                              inventoryId={inv.id}
                              price={own === null || own === undefined ? null : Number(own)}
                              label={inv.name}
                              allowEmpty
                            />
                          );
                        })}
                      </div>
                    </details>
                  )}
                  {!v.is_default && (
                    <CatalogActiveToggle
                      entity="variant"
                      id={v.id}
                      active={v.is_active}
                      reason={v.deactivation_reason}
                      noun="Presentación"
                    />
                  )}
                </>
              )}
            </Card>
          ))}
          {admin && product.is_active && (
            <Card>
              <CardTitle>Agregar presentación</CardTitle>
              <VariantForm
                productId={product.id}
                units={units.filter((u) => u.is_active)}
                baseUnitSymbol={baseUnit}
              />
            </Card>
          )}
        </section>

        <Card>
          <CardTitle>Historial de precios</CardTitle>
          {!history.length ? (
            <p className="text-muted text-sm">Sin cambios registrados.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {history.map((h) => (
                <li
                  key={h.id}
                  className="border-border flex flex-wrap justify-between gap-2 border-b pb-2 last:border-0"
                >
                  <span>
                    <strong>{variantName.get(h.variant_id)}</strong>
                    {h.inventory_id
                      ? ` · ${inventoryName.get(h.inventory_id) ?? "otro inventario"}`
                      : " · base"}
                    {": "}
                    {h.old_price === null ? "—" : formatMoney(h.old_price)} →{" "}
                    {h.new_price === null ? "precio base" : formatMoney(h.new_price)}
                    {h.reason && <span className="text-muted"> · {h.reason}</span>}
                  </span>
                  <span className="text-muted">{formatDateTime(h.changed_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {admin && (
          <Card>
            <CardTitle>Estado del producto</CardTitle>
            <CatalogActiveToggle
              entity="product"
              id={product.id}
              active={product.is_active}
              reason={product.deactivation_reason}
              noun="Producto"
            />
          </Card>
        )}
      </div>
    </>
  );
}
