import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { BackLink } from "@/components/layout/back-link";
import { NoPermission } from "@/components/layout/no-permission";
import { DocumentForm } from "@/components/inventory/document-form";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";
import { businessToday } from "@/lib/dates";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { can } from "@/modules/access/roles";
import { requireUser } from "@/modules/access/session";
import {
  ADMIN_ONLY_TYPES,
  CREATABLE_TYPES,
  DOCUMENT_TYPES,
  documentTypeFromSlug,
} from "@/modules/inventory/labels";
import {
  getCatalog,
  getStock,
  listInventories,
  listReasons,
  listTransferTargets,
} from "@/modules/inventory/queries";

export const metadata: Metadata = { title: "Registrar movimiento" };

export default async function NewMovementPage(props: PageProps<"/inventario/movimientos/nuevo">) {
  await connection();
  const user = await requireUser("/inventario/movimientos/nuevo");
  if (!can(user.role, "operations.write")) return <NoPermission />;
  const params = await props.searchParams;
  const slug = Array.isArray(params.tipo) ? params.tipo[0] : params.tipo;
  const inventoryParam = Array.isArray(params.inventario)
    ? params.inventario[0]
    : params.inventario;
  const isAdmin = can(user.role, "settings.manage");
  const allowed = CREATABLE_TYPES.filter((t) => isAdmin || !ADMIN_ONLY_TYPES.includes(t));
  const type = documentTypeFromSlug(slug);

  if (!type || !allowed.includes(type)) {
    return (
      <>
        <BackLink href="/inventario/movimientos" label="Movimientos" />
        <PageHeader title="Registrar movimiento" description="¿Qué quieres registrar?" />
        <ul className="grid gap-3 sm:grid-cols-2">
          {allowed.map((t) => (
            <li key={t}>
              <Link
                href={`/inventario/movimientos/nuevo?tipo=${DOCUMENT_TYPES[t].slug}${inventoryParam ? `&inventario=${inventoryParam}` : ""}`}
                className="border-border border-l-primary bg-surface hover:bg-surface-muted flex h-full flex-col gap-1 rounded-lg border border-l-4 p-4"
              >
                <span className="font-bold">{DOCUMENT_TYPES[t].label}</span>
                <span className="text-muted text-sm">{DOCUMENT_TYPES[t].description}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="text-muted mt-4 text-sm">
          Las ventas y compras se registran en sus propios módulos.
        </p>
      </>
    );
  }

  const supabase = await createSupabaseServerClient();
  const [inventories, targets, catalog, reasons, stock, { data: company }] = await Promise.all([
    listInventories(),
    type === "transfer" ? listTransferTargets() : Promise.resolve([]),
    getCatalog(),
    type === "entry" || type === "exit" || type === "adjustment"
      ? listReasons(type)
      : Promise.resolve([]),
    getStock(),
    supabase.from("company_settings").select("timezone, backdate_limit_days").single(),
  ]);

  const today = businessToday(company?.timezone ?? undefined);
  const limit = company?.backdate_limit_days ?? 0;
  const min = new Date(`${today}T12:00:00Z`);
  min.setUTCDate(min.getUTCDate() - limit);

  return (
    <>
      <BackLink href="/inventario/movimientos/nuevo" label="Otro tipo de movimiento" />
      <PageHeader title={DOCUMENT_TYPES[type].verb} />
      {!inventories.length ? (
        <EmptyState
          title="No tienes inventarios disponibles"
          description="Pide al administrador que cree uno o te dé acceso."
        />
      ) : !catalog.length ? (
        <EmptyState
          title="Aún no hay productos"
          description="Primero se deben crear productos en el catálogo."
        />
      ) : (
        <Card>
          <DocumentForm
            type={type as Exclude<typeof type, "reversal">}
            inventories={inventories.map((i) => ({
              id: i.id,
              label: `${i.name} · ${i.branchName}`,
            }))}
            targets={targets.map((t) => ({ id: t.id, label: `${t.name} · ${t.branchName}` }))}
            catalog={catalog.map((c) => ({
              variantId: c.variant_id!,
              productId: c.product_id!,
              label: c.display_name!,
              sku: c.sku,
              unitSymbol: c.unit_symbol ?? "",
              factor: Number(c.factor),
              allowsDecimals: Boolean(c.allows_decimals),
            }))}
            reasons={reasons}
            stock={Object.fromEntries(
              stock.map((s) => [`${s.inventory_id}:${s.variant_id}`, Number(s.quantity)]),
            )}
            defaultInventoryId={
              inventories.some((i) => i.id === inventoryParam) ? inventoryParam : undefined
            }
            today={today}
            minDate={min.toISOString().slice(0, 10)}
          />
        </Card>
      )}
    </>
  );
}
