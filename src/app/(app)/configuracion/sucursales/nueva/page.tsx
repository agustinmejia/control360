import type { Metadata } from "next";
import { BackLink } from "@/components/layout/back-link";
import { NoPermission } from "@/components/layout/no-permission";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/modules/access/session";
import { BranchForm } from "../branch-form";

export const metadata: Metadata = { title: "Nueva sucursal" };

export default async function NewBranchPage() {
  if (!(await requirePermission("settings.manage"))) return <NoPermission />;
  return (
    <>
      <BackLink href="/configuracion/sucursales" label="Sucursales" />
      <PageHeader title="Nueva sucursal" />
      <Card>
        <BranchForm />
      </Card>
    </>
  );
}
