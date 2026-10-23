"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useActionForm } from "@/components/forms/use-action-form";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { saveCategory, saveInventory, setCategoryActive } from "@/modules/inventory/actions";
import { categorySchema, inventorySchema } from "@/modules/inventory/schemas";

export function InventoryForm({
  branches,
  inventory,
}: {
  branches: { id: string; name: string }[];
  inventory?: { id: string; name: string; description: string | null; branchId: string };
}) {
  const router = useRouter();
  const { form, onSubmit, pending, errors } = useActionForm({
    schema: inventorySchema,
    action: saveInventory,
    defaultValues: inventory
      ? {
          id: inventory.id,
          branchId: inventory.branchId,
          name: inventory.name,
          description: inventory.description ?? "",
        }
      : { branchId: branches[0]?.id ?? "", name: "", description: "" },
    successMessage: inventory ? "Inventario actualizado." : "Inventario creado.",
    onSuccess: () => {
      if (!inventory) form.reset();
      router.refresh();
    },
  });
  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
    >
      <Field label="Nombre" required error={errors.name?.message}>
        {(p) => <Input {...p} {...form.register("name")} placeholder="Ej.: Insumos veterinarios" />}
      </Field>
      <Field label="Sucursal" required error={errors.branchId?.message}>
        {(p) => (
          <Select {...p} {...form.register("branchId")} disabled={Boolean(inventory)}>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field label="Descripción" error={errors.description?.message}>
        {(p) => <Input {...p} {...form.register("description")} />}
      </Field>
      <Button type="submit" variant={inventory ? "secondary" : "primary"} loading={pending}>
        {inventory ? "Guardar" : "Crear inventario"}
      </Button>
    </form>
  );
}

export function CategoryForm({ category }: { category?: { id: string; name: string } }) {
  const router = useRouter();
  const { form, onSubmit, pending, errors } = useActionForm({
    schema: categorySchema,
    action: saveCategory,
    defaultValues: category ? { id: category.id, name: category.name } : { name: "" },
    successMessage: category ? "Categoría actualizada." : "Categoría creada.",
    onSuccess: () => {
      if (!category) form.reset();
      router.refresh();
    },
  });
  return (
    <form onSubmit={onSubmit} noValidate className="flex items-end gap-2">
      <Field
        label={category ? "Nombre" : "Nueva categoría"}
        error={errors.name?.message}
        className="flex-1"
      >
        {(p) => <Input {...p} {...form.register("name")} />}
      </Field>
      <Button type="submit" variant={category ? "secondary" : "primary"} loading={pending}>
        {category ? "Guardar" : "Agregar"}
      </Button>
    </form>
  );
}

export function CategoryActiveButton({ id, active }: { id: string; active: boolean }) {
  const [pending, start] = useTransition();
  const [current, setCurrent] = useState(active);
  const toast = useToast();
  return (
    <Button
      variant="ghost"
      size="sm"
      loading={pending}
      onClick={() =>
        start(async () => {
          const r = await setCategoryActive({ id, active: !current });
          if (r.ok) setCurrent(!current);
          else toast.error(r.error.message);
        })
      }
    >
      {current ? "Desactivar" : "Reactivar"}
    </Button>
  );
}
