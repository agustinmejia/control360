import type { Metadata } from "next";
import { BackLink } from "@/components/layout/back-link";
import { NoPermission } from "@/components/layout/no-permission";
import { CatalogActiveToggle } from "@/components/inventory/product-forms";
import { InventoryForm } from "@/components/inventory/settings-forms";
import { Card, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/modules/access/session";
import { listInventories } from "@/modules/inventory/queries";
import { listBranchOptions } from "@/modules/settings/users";

export const metadata: Metadata = { title: "Inventarios" };

export default async function InventoriesSettingsPage() {
  if (!(await requirePermission("settings.manage"))) return <NoPermission />;
  const [inventories, branches] = await Promise.all([
    listInventories({ includeInactive: true }),
    listBranchOptions(),
  ]);
  const activeBranches = branches.filter((b) => b.is_active);

  return (
    <>
      <BackLink href="/configuracion" label="Configuración" />
      <PageHeader
        title="Inventarios"
        description="Cada inventario pertenece a una sucursal. Un producto puede tener stock en varios inventarios."
      />
      <div className="flex flex-col gap-4">
        <Card>
          <CardTitle>Nuevo inventario</CardTitle>
          <InventoryForm branches={activeBranches} />
        </Card>
        {inventories.map((inv) => (
          <Card key={inv.id} className="flex flex-col gap-4">
            <p className="text-muted text-sm">Sucursal: {inv.branchName}</p>
            <InventoryForm
              branches={branches}
              inventory={{
                id: inv.id,
                name: inv.name,
                description: inv.description,
                branchId: inv.branchId,
              }}
            />
            <CatalogActiveToggle
              entity="inventory"
              id={inv.id}
              active={inv.isActive}
              reason={inv.deactivationReason}
              noun="Inventario"
            />
          </Card>
        ))}
      </div>
    </>
  );
}
