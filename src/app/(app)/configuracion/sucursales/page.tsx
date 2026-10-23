import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { BackLink } from "@/components/layout/back-link";
import { NoPermission } from "@/components/layout/no-permission";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/modules/access/session";

export const metadata: Metadata = { title: "Sucursales" };

export default async function BranchesPage() {
  if (!(await requirePermission("settings.manage"))) return <NoPermission />;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("branches")
    .select("id, name, city, phone, is_active")
    .order("is_active", { ascending: false })
    .order("name");

  return (
    <>
      <BackLink href="/configuracion" label="Configuración" />
      <PageHeader
        title="Sucursales"
        description="Cada inventario pertenece a una sucursal."
        actions={
          <Link
            href="/configuracion/sucursales/nueva"
            className="bg-primary text-primary-foreground inline-flex min-h-11 items-center gap-2 rounded-lg px-4 font-semibold"
          >
            <Plus className="size-4" aria-hidden />
            Nueva sucursal
          </Link>
        }
      />
      {error ? (
        <ErrorState description="No se pudieron cargar las sucursales." />
      ) : !data.length ? (
        <EmptyState title="Aún no hay sucursales" />
      ) : (
        <ResponsiveTable
          caption="Sucursales"
          rows={data}
          rowKey={(b) => b.id}
          columns={[
            {
              key: "name",
              header: "Nombre",
              primary: true,
              cell: (b) => (
                <Link
                  href={`/configuracion/sucursales/${b.id}`}
                  className="text-primary font-semibold underline-offset-4 hover:underline"
                >
                  {b.name}
                </Link>
              ),
            },
            { key: "city", header: "Ciudad", cell: (b) => b.city ?? "—" },
            { key: "phone", header: "Teléfono", cell: (b) => b.phone ?? "—" },
            {
              key: "status",
              header: "Estado",
              cell: (b) => (
                <Badge tone={b.is_active ? "success" : "danger"}>
                  {b.is_active ? "Activa" : "Desactivada"}
                </Badge>
              ),
            },
          ]}
        />
      )}
    </>
  );
}
