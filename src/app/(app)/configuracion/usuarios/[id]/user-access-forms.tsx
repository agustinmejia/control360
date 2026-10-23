"use client";

import { useRouter } from "next/navigation";
import { useActionForm } from "@/components/forms/use-action-form";
import { ActiveToggle } from "@/components/settings/active-toggle";
import { BranchCheckboxes } from "@/components/settings/branch-checkboxes";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, type AppRole } from "@/modules/access/roles";
import { setUserActive, setUserBranches, setUserRole } from "@/modules/settings/actions";
import { userBranchesSchema, userRoleSchema } from "@/modules/settings/schemas";

export function RoleForm({
  userId,
  role,
  roles,
}: {
  userId: string;
  role: AppRole;
  roles: AppRole[];
}) {
  const router = useRouter();
  const { form, onSubmit, pending, errors } = useActionForm({
    schema: userRoleSchema,
    action: setUserRole,
    defaultValues: { userId, role, reason: "" },
    successMessage: "Rol actualizado.",
    onSuccess: () => router.refresh(),
  });
  const selected = form.watch("role") as AppRole;

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
      <Field label="Rol" error={errors.role?.message} hint={ROLE_DESCRIPTIONS[selected]}>
        {(p) => (
          <Select {...p} {...form.register("role")}>
            {roles.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field
        label="Motivo del cambio"
        error={errors.reason?.message}
        hint="Opcional. Queda en la bitácora."
      >
        {(p) => <Input {...p} {...form.register("reason")} />}
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" loading={pending} disabled={selected === role}>
          Cambiar rol
        </Button>
      </div>
    </form>
  );
}

export function BranchesForm({
  userId,
  branchIds,
  branches,
}: {
  userId: string;
  branchIds: string[];
  branches: { id: string; name: string; is_active: boolean }[];
}) {
  const router = useRouter();
  const { form, onSubmit, pending } = useActionForm({
    schema: userBranchesSchema,
    action: (values) =>
      setUserBranches({ ...values, branchIds: [values.branchIds].flat().filter(Boolean) }),
    defaultValues: { userId, branchIds },
    successMessage: "Sucursales actualizadas.",
    onSuccess: () => router.refresh(),
  });
  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <BranchCheckboxes branches={branches} register={form.register("branchIds")} />
      <Button type="submit" loading={pending} className="self-start">
        Guardar sucursales
      </Button>
    </form>
  );
}

export function UserStatus({
  userId,
  active,
  reason,
}: {
  userId: string;
  active: boolean;
  reason: string | null;
}) {
  return (
    <ActiveToggle
      active={active}
      reason={reason}
      noun="Usuario"
      consequence="No podrá ingresar ni ver datos. Su historial y sus registros se conservan; se puede reactivar."
      action={(input) => setUserActive({ userId, ...input })}
    />
  );
}
