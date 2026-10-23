"use client";

import { useRouter } from "next/navigation";
import { useActionForm } from "@/components/forms/use-action-form";
import { ActiveToggle } from "@/components/settings/active-toggle";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { DecimalInput, Input, Select, Textarea } from "@/components/ui/input";
import {
  createProduct,
  saveVariant,
  setCatalogActive,
  setPrice,
  updateProduct,
} from "@/modules/inventory/actions";
import {
  newProductSchema,
  priceSchema,
  productSchema,
  variantSchema,
} from "@/modules/inventory/schemas";

type Option = { id: string; name: string };
type UnitOption = Option & { symbol: string };

const decimalText = (v: string | number | null | undefined) =>
  v === null || v === undefined ? "" : String(Number(v)).replace(".", ",");

export function NewProductForm({
  units,
  categories,
}: {
  units: UnitOption[];
  categories: Option[];
}) {
  const router = useRouter();
  const { form, onSubmit, pending, errors } = useActionForm({
    schema: newProductSchema,
    action: createProduct,
    defaultValues: {
      name: "",
      categoryId: "",
      description: "",
      baseUnitId: units.find((u) => u.symbol === "u")?.id ?? "",
      sku: "",
      basePrice: "",
      minStock: "0",
    },
    successMessage: "Producto creado.",
    onSuccess: ({ id }) => router.push(`/inventario/productos/${id}`),
  });
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
      <Field label="Nombre" required error={errors.name?.message} className="sm:col-span-2">
        {(p) => <Input {...p} {...form.register("name")} autoComplete="off" />}
      </Field>
      <Field
        label="Unidad base"
        required
        error={errors.baseUnitId?.message}
        hint="Se usa para sumar todas las presentaciones (ej.: kg). No se puede cambiar después."
      >
        {(p) => (
          <Select {...p} {...form.register("baseUnitId")}>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.symbol})
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field label="Categoría" error={errors.categoryId?.message}>
        {(p) => (
          <Select {...p} {...form.register("categoryId")}>
            <option value="">Sin categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field label="Precio de venta (por unidad base)" required error={errors.basePrice?.message}>
        {(p) => (
          <DecimalInput {...p} {...form.register("basePrice")} prefix="Bs" placeholder="0,00" />
        )}
      </Field>
      <Field label="Código (opcional)" error={errors.sku?.message}>
        {(p) => <Input {...p} {...form.register("sku")} autoComplete="off" />}
      </Field>
      <Field
        label="Stock mínimo"
        error={errors.minStock?.message}
        hint="Se marca como “bajo mínimo” por debajo de esta cantidad."
      >
        {(p) => <DecimalInput {...p} {...form.register("minStock")} />}
      </Field>
      <Field label="Descripción" error={errors.description?.message} className="sm:col-span-2">
        {(p) => <Textarea {...p} {...form.register("description")} rows={2} />}
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" loading={pending}>
          Crear producto
        </Button>
      </div>
    </form>
  );
}

export function ProductForm({
  product,
  categories,
}: {
  product: { id: string; name: string; categoryId: string | null; description: string | null };
  categories: Option[];
}) {
  const router = useRouter();
  const { form, onSubmit, pending, errors } = useActionForm({
    schema: productSchema,
    action: updateProduct,
    defaultValues: {
      id: product.id,
      name: product.name,
      categoryId: product.categoryId ?? "",
      description: product.description ?? "",
    },
    successMessage: "Producto actualizado.",
    onSuccess: () => router.refresh(),
  });
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
      <Field label="Nombre" required error={errors.name?.message}>
        {(p) => <Input {...p} {...form.register("name")} />}
      </Field>
      <Field label="Categoría" error={errors.categoryId?.message}>
        {(p) => (
          <Select {...p} {...form.register("categoryId")}>
            <option value="">Sin categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field label="Descripción" error={errors.description?.message} className="sm:col-span-2">
        {(p) => <Textarea {...p} {...form.register("description")} rows={2} />}
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" loading={pending}>
          Guardar
        </Button>
      </div>
    </form>
  );
}

export function VariantForm({
  productId,
  variant,
  units,
  baseUnitSymbol,
}: {
  productId: string;
  variant?: { id: string; name: string; sku: string | null; minStock: number };
  units?: UnitOption[];
  baseUnitSymbol: string;
}) {
  const router = useRouter();
  const editing = Boolean(variant);
  const { form, onSubmit, pending, errors } = useActionForm({
    schema: variantSchema,
    action: saveVariant,
    defaultValues: variant
      ? {
          id: variant.id,
          productId,
          name: variant.name,
          sku: variant.sku ?? "",
          minStock: decimalText(variant.minStock),
        }
      : { productId, name: "", unitId: units?.[0]?.id ?? "", factor: "", sku: "", minStock: "0" },
    successMessage: editing ? "Presentación actualizada." : "Presentación agregada.",
    onSuccess: () => {
      if (!editing) form.reset();
      router.refresh();
    },
  });
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Field label="Nombre" required error={errors.name?.message}>
        {(p) => (
          <Input
            {...p}
            {...form.register("name")}
            placeholder={editing ? undefined : "Ej.: Saco 40 kg"}
          />
        )}
      </Field>
      {!editing && units && (
        <>
          <Field label="Unidad" required error={errors.unitId?.message}>
            {(p) => (
              <Select {...p} {...form.register("unitId")}>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field
            label={`Contiene (${baseUnitSymbol})`}
            required
            error={errors.factor?.message}
            hint="Ej.: un saco contiene 40 kg. No se puede cambiar después."
          >
            {(p) => <DecimalInput {...p} {...form.register("factor")} suffix={baseUnitSymbol} />}
          </Field>
        </>
      )}
      <Field label="Código" error={errors.sku?.message}>
        {(p) => <Input {...p} {...form.register("sku")} />}
      </Field>
      <Field label="Stock mínimo" error={errors.minStock?.message}>
        {(p) => <DecimalInput {...p} {...form.register("minStock")} />}
      </Field>
      <div className="flex items-end lg:col-span-4">
        <Button type="submit" variant={editing ? "secondary" : "primary"} loading={pending}>
          {editing ? "Guardar presentación" : "Agregar presentación"}
        </Button>
      </div>
    </form>
  );
}

export function PriceForm({
  variantId,
  inventoryId,
  price,
  label,
  allowEmpty,
}: {
  variantId: string;
  inventoryId?: string;
  price: number | null;
  label: string;
  allowEmpty?: boolean;
}) {
  const router = useRouter();
  const { form, onSubmit, pending, errors } = useActionForm({
    schema: priceSchema,
    action: setPrice,
    defaultValues: { variantId, inventoryId, price: decimalText(price), reason: "" },
    successMessage: "Precio actualizado.",
    onSuccess: () => {
      form.setValue("reason", "");
      router.refresh();
    },
  });
  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="grid items-end gap-3 sm:grid-cols-[10rem_1fr_auto]"
    >
      <Field
        label={label}
        error={errors.price?.message}
        hint={allowEmpty ? "Vacío = usa el precio base" : undefined}
      >
        {(p) => <DecimalInput {...p} {...form.register("price")} prefix="Bs" />}
      </Field>
      <Field label="Motivo del cambio" error={errors.reason?.message}>
        {(p) => <Input {...p} {...form.register("reason")} placeholder="Opcional" />}
      </Field>
      <Button type="submit" variant="secondary" loading={pending}>
        Guardar precio
      </Button>
    </form>
  );
}

export function CatalogActiveToggle({
  entity,
  id,
  active,
  reason,
  noun,
}: {
  entity: "product" | "variant" | "inventory";
  id: string;
  active: boolean;
  reason: string | null;
  noun: string;
}) {
  return (
    <ActiveToggle
      active={active}
      reason={reason}
      noun={noun}
      consequence="No se podrá usar en nuevos movimientos. Su historial y existencias se conservan; se puede reactivar."
      action={(input) => setCatalogActive({ entity, id, ...input })}
    />
  );
}
