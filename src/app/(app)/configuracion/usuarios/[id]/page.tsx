import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/layout/back-link";
import { NoPermission } from "@/components/layout/no-permission";
import { UserStatusBadge } from "@/components/settings/user-status-badge";
import { Card, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { formatDateTime } from "@/lib/dates";
import { ROLE_LABELS, assignableRoles, canManageUser } from "@/modules/access/roles";
import { requirePermission } from "@/modules/access/session";
import { listBranchOptions, listManagedUsers } from "@/modules/settings/users";
import { BranchesForm, RoleForm, UserStatus } from "./user-access-forms";

export const metadata: Metadata = { title: "Usuario" };

export default async function UserPage(props: PageProps<"/configuracion/usuarios/[id]">) {
  const me = await requirePermission("users.manage");
  if (!me) return <NoPermission />;
  const { id } = await props.params;
  const [{ users }, branches] = await Promise.all([listManagedUsers(), listBranchOptions()]);
  const user = users.find((u) => u.id === id);
  if (!user) notFound();

  const manageable = canManageUser(me, user);
  const restrictable = user.role === "operator" || user.role === "viewer";

  return (
    <>
      <BackLink href="/configuracion/usuarios" label="Usuarios" />
      <PageHeader
        title={user.fullName || user.email}
        description={user.email}
        actions={<UserStatusBadge status={user.status} />}
      />
      <div className="flex flex-col gap-4">
        <Card>
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted">Rol</dt>
              <dd className="font-semibold">{ROLE_LABELS[user.role]}</dd>
            </div>
            <div>
              <dt className="text-muted">Invitado</dt>
              <dd>{user.invitedAt ? formatDateTime(user.invitedAt) : "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Último ingreso</dt>
              <dd>{user.lastSignInAt ? formatDateTime(user.lastSignInAt) : "Nunca"}</dd>
            </div>
          </dl>
          {!manageable && (
            <p className="text-muted mt-3 text-sm">
              {user.id === me.id
                ? "No puedes cambiar tu propio rol ni desactivarte."
                : "Solo un propietario puede gestionar a otro propietario."}
            </p>
          )}
        </Card>
        {manageable && (
          <>
            <Card>
              <CardTitle>Rol</CardTitle>
              <RoleForm userId={user.id} role={user.role} roles={assignableRoles(me.role)} />
            </Card>
            {restrictable && branches.length > 1 && (
              <Card>
                <CardTitle>Acceso por sucursal</CardTitle>
                <BranchesForm userId={user.id} branchIds={user.branchIds} branches={branches} />
              </Card>
            )}
            <Card>
              <CardTitle>Estado</CardTitle>
              <UserStatus
                userId={user.id}
                active={user.isActive}
                reason={user.deactivationReason}
              />
            </Card>
          </>
        )}
      </div>
    </>
  );
}
