"use client";

import { useRouter } from "next/navigation";
import { useActionForm } from "@/components/forms/use-action-form";
import { BranchCheckboxes } from "@/components/settings/branch-checkboxes";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, type AppRole } from "@/modules/access/roles";
import { inviteUser } from "@/modules/settings/actions";
import { inviteSchema } from "@/modules/settings/schemas";

export function InviteForm({
  roles,
  branches,
  enabled,
}: {
  roles: AppRole[];
  branches: { id: string; name: string; is_active: boolean }[];
  enabled: boolean;
}) {
  const router = useRouter();
  const { form, onSubmit, pending, errors } = useActionForm({
    schema: inviteSchema,
    action: (values) =>
      inviteUser({ ...values, branchIds: [values.branchIds ?? []].flat().filter(Boolean) }),
    defaultValues: { email: "", fullName: "", role: "operator", branchIds: [] },
    successMessage: "Invitación enviada por correo.",
    onSuccess: () => {
      form.reset();
      router.refresh();
    },
  });
  const role = form.watch("role") as AppRole;

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
      {!enabled && (
        <p
          role="alert"
          className="bg-warning-soft text-warning rounded-lg p-3 text-sm sm:col-span-2"
        >
          Para enviar invitaciones, configura <code>SUPABASE_SECRET_KEY</code> en el servidor
          (Vercel).
        </p>
      )}
      <Field label="Nombre" required error={errors.fullName?.message}>
        {(p) => <Input {...p} {...form.register("fullName")} autoComplete="off" />}
      </Field>
      <Field label="Correo electrónico" required error={errors.email?.message}>
        {(p) => (
          <Input
            {...p}
            {...form.register("email")}
            type="email"
            inputMode="email"
            autoComplete="off"
          />
        )}
      </Field>
      <Field label="Rol" required error={errors.role?.message} hint={ROLE_DESCRIPTIONS[role]}>
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
      {branches.length > 1 && (role === "operator" || role === "viewer") && (
        <div className="sm:col-span-2">
          <BranchCheckboxes branches={branches} register={form.register("branchIds")} />
        </div>
      )}
      <div className="sm:col-span-2">
        <Button type="submit" loading={pending} disabled={!enabled}>
          Enviar invitación
        </Button>
      </div>
    </form>
  );
}
