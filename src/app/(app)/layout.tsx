import { AppShell } from "@/components/layout/app-shell";

// El nombre de la empresa se leerá de `company_settings` desde el Bloque 2.
const COMPANY_NAME = "Grupo Pecuario";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return <AppShell companyName={COMPANY_NAME}>{children}</AppShell>;
}
