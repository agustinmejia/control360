"use client";

import { useRouter } from "next/navigation";
import { useActionForm } from "@/components/forms/use-action-form";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { updateCompany } from "@/modules/settings/actions";
import { companySchema, type CompanyInput } from "@/modules/settings/schemas";

export function CompanyForm({ defaults }: { defaults: CompanyInput }) {
  const router = useRouter();
  const { form, onSubmit, pending, errors } = useActionForm({
    schema: companySchema,
    action: updateCompany,
    defaultValues: defaults,
    successMessage: "Datos de la empresa guardados.",
    onSuccess: () => router.refresh(),
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
      <Field
        label="Nombre comercial"
        required
        error={errors.name?.message}
        hint="Aparece en la app y en los reportes."
      >
        {(p) => <Input {...p} {...form.register("name")} />}
      </Field>
      <Field label="Razón social" error={errors.legalName?.message}>
        {(p) => <Input {...p} {...form.register("legalName")} />}
      </Field>
      <Field label="NIT" error={errors.taxId?.message}>
        {(p) => <Input {...p} {...form.register("taxId")} inputMode="numeric" />}
      </Field>
      <Field label="Teléfono" error={errors.phone?.message}>
        {(p) => <Input {...p} {...form.register("phone")} type="tel" />}
      </Field>
      <Field label="Dirección" error={errors.address?.message} className="sm:col-span-2">
        {(p) => <Textarea {...p} {...form.register("address")} rows={2} />}
      </Field>
      <Field
        label="Días permitidos para registrar con fecha pasada"
        required
        error={errors.backdateLimitDays?.message}
        hint="Las operaciones con fecha pasada quedan marcadas en la bitácora."
      >
        {(p) => <Input {...p} {...form.register("backdateLimitDays")} inputMode="numeric" />}
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" loading={pending}>
          Guardar
        </Button>
      </div>
    </form>
  );
}
