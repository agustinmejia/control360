import { AppShell } from "@/components/layout/app-shell";
import { navItemsFor } from "@/modules/access/navigation";
import { getCompanyName, requireUser } from "@/modules/access/session";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const [user, companyName] = await Promise.all([requireUser(), getCompanyName()]);
  return (
    <AppShell
      companyName={companyName}
      user={{ fullName: user.fullName, email: user.email, role: user.role }}
      allowedSlugs={navItemsFor(user.role).map((item) => item.slug)}
    >
      {children}
    </AppShell>
  );
}
