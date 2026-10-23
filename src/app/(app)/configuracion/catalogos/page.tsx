import type { Metadata } from "next";
import { BackLink } from "@/components/layout/back-link";
import { NoPermission } from "@/components/layout/no-permission";
import { CategoryActiveButton, CategoryForm } from "@/components/inventory/settings-forms";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/modules/access/session";
import { DOCUMENT_TYPES } from "@/modules/inventory/labels";
import { listCategories, listUnits } from "@/modules/inventory/queries";

export const metadata: Metadata = { title: "Catálogos" };

export default async function CatalogsPage() {
  if (!(await requirePermission("settings.manage"))) return <NoPermission />;
  const supabase = await createSupabaseServerClient();
  const [categories, units, { data: reasons }] = await Promise.all([
    listCategories({ includeInactive: true }),
    listUnits(),
    supabase
      .from("movement_reasons")
      .select("id, name, document_type, is_active")
      .order("document_type")
      .order("name"),
  ]);

  return (
    <>
      <BackLink href="/configuracion" label="Configuración" />
      <PageHeader
        title="Catálogos"
        description="Categorías de productos, unidades de medida y motivos de movimientos."
      />
      <div className="flex flex-col gap-4">
        <Card className="flex flex-col gap-4">
          <CardTitle>Categorías</CardTitle>
          <CategoryForm />
          <ul className="flex flex-col gap-3">
            {categories.map((c) => (
              <li key={c.id} className="border-border flex flex-wrap items-end gap-2 border-t pt-3">
                <div className="min-w-0 flex-1">
                  <CategoryForm category={{ id: c.id, name: c.name }} />
                </div>
                {!c.is_active && <Badge tone="danger">Desactivada</Badge>}
                <CategoryActiveButton id={c.id} active={c.is_active} />
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardTitle>Unidades de medida</CardTitle>
          <ul className="grid gap-1 text-sm sm:grid-cols-2">
            {units.map((u) => (
              <li key={u.id}>
                {u.name} ({u.symbol}) · {u.allows_decimals ? "admite decimales" : "solo enteros"}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardTitle>Motivos de movimientos</CardTitle>
          <ul className="grid gap-1 text-sm sm:grid-cols-2">
            {(reasons ?? []).map((r) => (
              <li key={r.id}>
                {DOCUMENT_TYPES[r.document_type].label}: {r.name}
                {!r.is_active && " (desactivado)"}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
