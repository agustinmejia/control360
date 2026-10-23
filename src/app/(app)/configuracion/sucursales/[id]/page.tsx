import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/layout/back-link";
import { NoPermission } from "@/components/layout/no-permission";
import { Card, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/modules/access/session";
import { BranchForm } from "../branch-form";
import { BranchStatus } from "./branch-status";

export const metadata: Metadata = { title: "Sucursal" };

export default async function BranchPage(props: PageProps<"/configuracion/sucursales/[id]">) {
  if (!(await requirePermission("settings.manage"))) return <NoPermission />;
  const { id } = await props.params;
  const supabase = await createSupabaseServerClient();
  const { data: branch } = await supabase
    .from("branches")
    .select("id, name, city, address, phone, is_active, deactivation_reason")
    .eq("id", id)
    .maybeSingle();
  if (!branch) notFound();

  return (
    <>
      <BackLink href="/configuracion/sucursales" label="Sucursales" />
      <PageHeader title={branch.name} />
      <div className="flex flex-col gap-4">
        <Card>
          <CardTitle>Datos</CardTitle>
          <BranchForm
            defaults={{
              id: branch.id,
              name: branch.name,
              city: branch.city ?? "",
              address: branch.address ?? "",
              phone: branch.phone ?? "",
            }}
          />
        </Card>
        <Card>
          <CardTitle>Estado</CardTitle>
          <BranchStatus
            id={branch.id}
            active={branch.is_active}
            reason={branch.deactivation_reason}
          />
        </Card>
      </div>
    </>
  );
}
