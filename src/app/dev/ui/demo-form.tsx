"use client";

import { useState } from "react";
import { useActionForm } from "@/components/forms/use-action-form";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { DecimalInput, Input, Select } from "@/components/ui/input";
import { businessToday } from "@/lib/dates";
import { demoAction } from "./actions";
import { demoSchema } from "./schema";

export function DemoForm() {
  const [result, setResult] = useState<string | null>(null);
  const { form, onSubmit, pending, errors } = useActionForm({
    schema: demoSchema,
    action: demoAction,
    defaultValues: { product: "", price: "", date: businessToday(), unit: "unidad" },
    successMessage: "Datos válidos (no se guardó nada).",
    onSuccess: (data) => setResult(data.message),
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
      <Field
        label="Producto"
        required
        error={errors.product?.message}
        hint='Escribe "error" para simular un error del servidor.'
      >
        {(p) => <Input {...p} {...form.register("product")} autoComplete="off" />}
      </Field>
      <Field label="Precio de venta" required error={errors.price?.message}>
        {(p) => <DecimalInput {...p} {...form.register("price")} prefix="Bs" placeholder="0,00" />}
      </Field>
      <Field label="Fecha" required error={errors.date?.message}>
        {(p) => <Input {...p} {...form.register("date")} type="date" />}
      </Field>
      <Field label="Unidad" required error={errors.unit?.message}>
        {(p) => (
          <Select {...p} {...form.register("unit")}>
            <option value="unidad">Unidad</option>
            <option value="kg">Kilogramo</option>
            <option value="saco">Saco</option>
          </Select>
        )}
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" loading={pending} fullWidth className="sm:w-auto">
          Validar en el servidor
        </Button>
        {result && (
          <p className="text-muted mt-3 text-sm" role="status">
            {result}
          </p>
        )}
      </div>
    </form>
  );
}
