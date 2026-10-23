import type { Metadata } from "next";
import { BackLink } from "@/components/layout/back-link";
import { NoPermission } from "@/components/layout/no-permission";
import { NewProductForm } from "@/components/inventory/product-forms";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/modules/access/session";
import { listCategories, listUnits } from "@/modules/inventory/queries";

export const metadata: Metadata = { title: "Nuevo producto" };

export default async function NewProductPage() {
  if (!(await requirePermission("settings.manage"))) return <NoPermission />;
  const [units, categories] = await Promise.all([listUnits(), listCategories()]);
  return (
    <>
      <BackLink href="/inventario/productos" label="Productos" />
      <PageHeader
        title="Nuevo producto"
        description="Después podrás agregarle presentaciones (saco, caja…)."
      />
      <Card>
        <NewProductForm units={units.filter((u) => u.is_active)} categories={categories} />
      </Card>
    </>
  );
}
