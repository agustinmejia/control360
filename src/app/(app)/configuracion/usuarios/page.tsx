import type { Metadata } from "next";
import Link from "next/link";
import { BackLink } from "@/components/layout/back-link";
import { NoPermission } from "@/components/layout/no-permission";
import { UserStatusBadge } from "@/components/settings/user-status-badge";
import { Card, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { ErrorState } from "@/components/ui/states";
import { formatDateTime } from "@/lib/dates";
import { isAdminConfigured } from "@/lib/supabase/admin";
import { ROLE_LABELS, assignableRoles } from "@/modules/access/roles";
import { requirePermission } from "@/modules/access/session";
import { listBranchOptions, listManagedUsers } from "@/modules/settings/users";
import { InviteForm } from "./invite-form";

export const metadata: Metadata = { title: "Usuarios" };

export default async function UsersPage() {
  const me = await requirePermission("users.manage");
  if (!me) return <NoPermission />;
  const [{ users, error }, branches] = await Promise.all([listManagedUsers(), listBranchOptions()]);
  const branchName = new Map(branches.map((b) => [b.id, b.name]));

  return (
    <>
      <BackLink href="/configuracion" label="Configuración" />
      <PageHeader
        title="Usuarios"
        description="Nadie se borra: los usuarios se desactivan y su historial se conserva."
      />
      <div className="flex flex-col gap-4">
        <Card>
          <CardTitle>Invitar usuario</CardTitle>
          <InviteForm
            roles={assignableRoles(me.role)}
            branches={branches}
            enabled={isAdminConfigured()}
          />
        </Card>
        {error ? (
          <ErrorState description="No se pudo cargar la lista de usuarios." />
        ) : (
          <ResponsiveTable
            caption="Usuarios"
            rows={users}
            rowKey={(u) => u.id}
            columns={[
              {
                key: "name",
                header: "Usuario",
                primary: true,
                cell: (u) => (
                  <Link
                    href={`/configuracion/usuarios/${u.id}`}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    <span className="block font-semibold">{u.fullName || u.email}</span>
                    <span className="text-muted block text-sm">{u.email}</span>
                  </Link>
                ),
              },
              { key: "role", header: "Rol", cell: (u) => ROLE_LABELS[u.role] },
              {
                key: "branches",
                header: "Sucursales",
                cell: (u) =>
                  u.role === "owner" || u.role === "admin" || !u.branchIds.length
                    ? "Todas"
                    : u.branchIds.map((id) => branchName.get(id) ?? "—").join(", "),
              },
              {
                key: "status",
                header: "Estado",
                cell: (u) => <UserStatusBadge status={u.status} />,
              },
              {
                key: "last",
                header: "Último ingreso",
                cell: (u) => (u.lastSignInAt ? formatDateTime(u.lastSignInAt) : "Nunca"),
              },
            ]}
          />
        )}
      </div>
    </>
  );
}
