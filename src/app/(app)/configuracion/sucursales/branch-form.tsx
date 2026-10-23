"use client";

import { useRouter } from "next/navigation";
import { useActionForm } from "@/components/forms/use-action-form";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { saveBranch } from "@/modules/settings/actions";
import { branchSchema, type BranchInput } from "@/modules/settings/schemas";

export function BranchForm({ defaults }: { defaults?: BranchInput }) {
  const router = useRouter();
  const editing = Boolean(defaults?.id);
  const { form, onSubmit, pending, errors } = useActionForm({
    schema: branchSchema,
    action: saveBranch,
    defaultValues: defaults ?? { name: "", city: "", address: "", phone: "" },
    successMessage: editing ? "Sucursal actualizada." : "Sucursal creada.",
    onSuccess: () => {
      router.push("/configuracion/sucursales");
      router.refresh();
    },
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
      <Field label="Nombre" required error={errors.name?.message}>
        {(p) => <Input {...p} {...form.register("name")} />}
      </Field>
      <Field label="Ciudad" error={errors.city?.message}>
        {(p) => <Input {...p} {...form.register("city")} />}
      </Field>
      <Field label="Teléfono" error={errors.phone?.message}>
        {(p) => <Input {...p} {...form.register("phone")} type="tel" />}
      </Field>
      <Field label="Dirección" error={errors.address?.message} className="sm:col-span-2">
        {(p) => <Textarea {...p} {...form.register("address")} rows={2} />}
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" loading={pending}>
          {editing ? "Guardar cambios" : "Crear sucursal"}
        </Button>
      </div>
    </form>
  );
}
