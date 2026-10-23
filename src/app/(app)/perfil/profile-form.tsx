"use client";

import { useRouter } from "next/navigation";
import { useActionForm } from "@/components/forms/use-action-form";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { updateProfile } from "@/modules/auth/actions";
import { profileSchema } from "@/modules/auth/schemas";

export function ProfileForm({ fullName, phone }: { fullName: string; phone: string }) {
  const router = useRouter();
  const { form, onSubmit, pending, errors } = useActionForm({
    schema: profileSchema,
    action: updateProfile,
    defaultValues: { fullName, phone },
    successMessage: "Perfil actualizado.",
    onSuccess: () => router.refresh(),
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
      <Field label="Nombre completo" required error={errors.fullName?.message}>
        {(p) => <Input {...p} {...form.register("fullName")} autoComplete="name" />}
      </Field>
      <Field label="Teléfono" error={errors.phone?.message}>
        {(p) => (
          <Input {...p} {...form.register("phone")} type="tel" autoComplete="tel" inputMode="tel" />
        )}
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" loading={pending}>
          Guardar cambios
        </Button>
      </div>
    </form>
  );
}
