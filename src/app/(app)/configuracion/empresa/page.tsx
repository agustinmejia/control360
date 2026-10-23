import type { Metadata } from "next";
import { BackLink } from "@/components/layout/back-link";
import { NoPermission } from "@/components/layout/no-permission";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/modules/access/session";
import { CompanyForm } from "./company-form";

export const metadata: Metadata = { title: "Empresa" };

export default async function CompanyPage() {
  if (!(await requirePermission("settings.manage"))) return <NoPermission />;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("company_settings").select("*").single();

  return (
    <>
      <BackLink href="/configuracion" label="Configuración" />
      <PageHeader
        title="Empresa"
        description={data ? `Moneda: ${data.currency} · Zona horaria: ${data.timezone}` : undefined}
      />
      {error || !data ? (
        <ErrorState description="No se pudieron cargar los datos de la empresa." />
      ) : (
        <Card>
          <CompanyForm
            defaults={{
              name: data.name,
              legalName: data.legal_name ?? "",
              taxId: data.tax_id ?? "",
              phone: data.phone ?? "",
              address: data.address ?? "",
              backdateLimitDays: String(data.backdate_limit_days),
            }}
          />
        </Card>
      )}
    </>
  );
}
