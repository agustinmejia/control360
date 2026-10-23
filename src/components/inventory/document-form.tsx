"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useWatch, type Control } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { useActionForm } from "@/components/forms/use-action-form";
import { Button } from "@/components/ui/button";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Field } from "@/components/ui/field";
import { DecimalInput, Input, Select, Textarea } from "@/components/ui/input";
import { formatQty } from "@/lib/format";
import type { z } from "@/lib/validation";
import { postDocument } from "@/modules/inventory/actions";
import { DOCUMENT_TYPES, type DocumentType } from "@/modules/inventory/labels";
import {
  adjustmentSchema,
  conversionSchema,
  entrySchema,
  exitSchema,
  openingSchema,
  transferSchema,
} from "@/modules/inventory/schemas";

type CreatableType = Exclude<DocumentType, "reversal">;

const SCHEMAS: Record<CreatableType, z.ZodType> = {
  opening: openingSchema,
  entry: entrySchema,
  exit: exitSchema,
  adjustment: adjustmentSchema,
  transfer: transferSchema,
  conversion: conversionSchema,
};

type Line = { variantId: string; quantity: string; unitCost: string; counted: string };
type Values = {
  type: CreatableType;
  requestId: string;
  inventoryId: string;
  targetInventoryId: string;
  reasonId: string;
  date: string;
  notes: string;
  lines: Line[];
  fromVariantId: string;
  fromQuantity: string;
  toVariantId: string;
  toQuantity: string;
};

export type CatalogOption = {
  variantId: string;
  productId: string;
  label: string;
  sku: string | null;
  unitSymbol: string;
  factor: number;
  allowsDecimals: boolean;
};

const emptyLine: Line = { variantId: "", quantity: "", unitCost: "", counted: "" };

export function DocumentForm({
  type,
  inventories,
  targets,
  catalog,
  reasons,
  stock,
  defaultInventoryId,
  today,
  minDate,
}: {
  type: CreatableType;
  inventories: { id: string; label: string }[];
  targets: { id: string; label: string }[];
  catalog: CatalogOption[];
  reasons: { id: string; name: string }[];
  /** Existencia actual por "inventario:presentación". */
  stock: Record<string, number>;
  defaultInventoryId?: string;
  today: string;
  minDate: string;
}) {
  const router = useRouter();
  const info = DOCUMENT_TYPES[type];
  // Un identificador por formulario: si se envía dos veces (doble toque, reintento), se registra una sola.
  const [requestId] = useState(() => crypto.randomUUID());

  const { form, onSubmit, pending, errors } = useActionForm({
    schema: SCHEMAS[type] as unknown as z.ZodType<Values, Values>,
    action: postDocument,
    defaultValues: {
      type,
      requestId,
      inventoryId: defaultInventoryId ?? inventories[0]?.id ?? "",
      targetInventoryId: "",
      reasonId: "",
      date: today,
      notes: "",
      lines: [{ ...emptyLine }],
      fromVariantId: "",
      fromQuantity: "",
      toVariantId: "",
      toQuantity: "",
    },
    successMessage: `${info.label} registrada.`,
    onSuccess: ({ id }) => {
      router.push(`/inventario/movimientos/${id}`);
      router.refresh();
    },
  });

  const inventoryId = useWatch({ control: form.control, name: "inventoryId" });
  const available = (variantId: string) => stock[`${inventoryId}:${variantId}`] ?? 0;
  const byId = useMemo(() => new Map(catalog.map((c) => [c.variantId, c])), [catalog]);

  const options: ComboboxOption[] = useMemo(
    () =>
      catalog.map((c) => ({
        value: c.variantId,
        label: c.label,
        hint: [
          c.sku,
          `Disponible: ${formatQty(stock[`${inventoryId}:${c.variantId}`] ?? 0, c.unitSymbol)}`,
        ]
          .filter(Boolean)
          .join(" · "),
      })),
    [catalog, stock, inventoryId],
  );

  const rootError = (errors as { lines?: { message?: string; root?: { message?: string } } }).lines;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <p className="text-muted">{info.description}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={type === "transfer" ? "Desde el inventario" : "Inventario"}
          required
          error={errors.inventoryId?.message}
        >
          {(p) => (
            <Select {...p} {...form.register("inventoryId")}>
              {inventories.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        {type === "transfer" && (
          <Field label="Hacia el inventario" required error={errors.targetInventoryId?.message}>
            {(p) => (
              <Select {...p} {...form.register("targetInventoryId")}>
                <option value="">Elige el destino</option>
                {targets
                  .filter((t) => t.id !== inventoryId)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
              </Select>
            )}
          </Field>
        )}
        <Field
          label="Fecha"
          required
          error={errors.date?.message}
          hint={minDate < today ? "Las fechas pasadas quedan marcadas en la bitácora." : undefined}
        >
          {(p) => <Input {...p} {...form.register("date")} type="date" min={minDate} max={today} />}
        </Field>
        {(type === "entry" || type === "exit" || type === "adjustment") && (
          <Field label="Motivo" required error={errors.reasonId?.message}>
            {(p) => (
              <Select {...p} {...form.register("reasonId")}>
                <option value="">Elige el motivo</option>
                {reasons.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}
      </div>

      {type === "conversion" ? (
        <ConversionFields
          control={form.control}
          form={form}
          catalog={catalog}
          options={options}
          byId={byId}
          available={available}
        />
      ) : (
        <LinesEditor
          type={type}
          control={form.control}
          form={form}
          options={options}
          byId={byId}
          available={available}
        />
      )}
      {rootError?.message && <p className="text-danger text-sm font-medium">{rootError.message}</p>}
      {rootError?.root?.message && (
        <p className="text-danger text-sm font-medium">{rootError.root.message}</p>
      )}

      <Field label="Observaciones" error={errors.notes?.message}>
        {(p) => <Textarea {...p} {...form.register("notes")} rows={2} />}
      </Field>

      <div>
        <Button type="submit" loading={pending} fullWidth className="sm:w-auto">
          {info.verb}
        </Button>
      </div>
    </form>
  );
}

type FormApi = ReturnType<typeof useActionForm<z.ZodType<Values, Values>, { id: string }>>["form"];

function LinesEditor({
  type,
  control,
  form,
  options,
  byId,
  available,
}: {
  type: CreatableType;
  control: Control<Values>;
  form: FormApi;
  options: ComboboxOption[];
  byId: Map<string, CatalogOption>;
  available: (variantId: string) => number;
}) {
  const { fields, append, remove } = useFieldArray({ control, name: "lines" });
  const lines = useWatch({ control, name: "lines" });
  const lineErrors = form.formState.errors.lines;
  const withCost = type === "opening" || type === "entry";
  const isAdjustment = type === "adjustment";

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-2 font-semibold">Productos</legend>
      {fields.map((field, index) => {
        const variantId = lines?.[index]?.variantId ?? "";
        const item = byId.get(variantId);
        const err = Array.isArray(lineErrors) ? lineErrors[index] : undefined;
        return (
          <div
            key={field.id}
            className="border-border grid gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_10rem_10rem_auto] sm:items-start"
          >
            <Field label="Producto" required error={err?.variantId?.message}>
              {(p) => (
                <Combobox
                  id={p.id}
                  describedBy={p["aria-describedby"]}
                  invalid={p["aria-invalid"]}
                  options={options}
                  value={variantId}
                  onChange={(v) =>
                    form.setValue(`lines.${index}.variantId`, v, {
                      shouldValidate: form.formState.isSubmitted,
                    })
                  }
                  placeholder="Buscar producto…"
                />
              )}
            </Field>
            {isAdjustment ? (
              <Field
                label="Cantidad contada"
                required
                error={err?.counted?.message}
                hint={
                  item ? `Sistema: ${formatQty(available(variantId), item.unitSymbol)}` : undefined
                }
              >
                {(p) => (
                  <DecimalInput
                    {...p}
                    {...form.register(`lines.${index}.counted`)}
                    suffix={item?.unitSymbol}
                  />
                )}
              </Field>
            ) : (
              <Field
                label="Cantidad"
                required
                error={err?.quantity?.message}
                hint={
                  item && !withCost
                    ? `Disponible: ${formatQty(available(variantId), item.unitSymbol)}`
                    : undefined
                }
              >
                {(p) => (
                  <DecimalInput
                    {...p}
                    {...form.register(`lines.${index}.quantity`)}
                    suffix={item?.unitSymbol}
                  />
                )}
              </Field>
            )}
            {withCost ? (
              <Field label="Costo unitario" error={err?.unitCost?.message} hint="Opcional">
                {(p) => (
                  <DecimalInput {...p} {...form.register(`lines.${index}.unitCost`)} prefix="Bs" />
                )}
              </Field>
            ) : (
              <span className="hidden sm:block" />
            )}
            <Button
              variant="ghost"
              className="self-end sm:mt-7"
              aria-label={`Quitar producto ${index + 1}`}
              disabled={fields.length === 1}
              onClick={() => remove(index)}
            >
              <Trash2 className="size-4" aria-hidden />
              <span className="sm:hidden">Quitar</span>
            </Button>
          </div>
        );
      })}
      <Button variant="secondary" className="self-start" onClick={() => append({ ...emptyLine })}>
        <Plus className="size-4" aria-hidden />
        Agregar producto
      </Button>
    </fieldset>
  );
}

function ConversionFields({
  control,
  form,
  catalog,
  options,
  byId,
  available,
}: {
  control: Control<Values>;
  form: FormApi;
  catalog: CatalogOption[];
  options: ComboboxOption[];
  byId: Map<string, CatalogOption>;
  available: (variantId: string) => number;
}) {
  const [fromId, toId, fromQty] = useWatch({
    control,
    name: ["fromVariantId", "toVariantId", "fromQuantity"],
  });
  const from = byId.get(fromId);
  const to = byId.get(toId);
  const errors = form.formState.errors;
  // Solo productos con más de una presentación se pueden fraccionar.
  const multi = new Set(
    catalog
      .filter((c) =>
        catalog.some((o) => o.productId === c.productId && o.variantId !== c.variantId),
      )
      .map((c) => c.productId),
  );
  const fromOptions = options.filter((o) => multi.has(byId.get(o.value)?.productId ?? ""));
  const toOptions = options.filter(
    (o) => from && byId.get(o.value)?.productId === from.productId && o.value !== from.variantId,
  );
  const maxTo =
    from && to && Number(fromQty.replace(",", ".")) > 0
      ? (Number(fromQty.replace(",", ".")) * from.factor) / to.factor
      : null;

  return (
    <fieldset className="grid gap-4 sm:grid-cols-2">
      <legend className="mb-2 font-semibold">Fraccionamiento</legend>
      <Field label="Presentación que se abre" required error={errors.fromVariantId?.message}>
        {(p) => (
          <Combobox
            id={p.id}
            invalid={p["aria-invalid"]}
            describedBy={p["aria-describedby"]}
            options={fromOptions}
            value={fromId}
            onChange={(v) => {
              form.setValue("fromVariantId", v);
              form.setValue("toVariantId", "");
            }}
            placeholder="Ej.: Saco 40 kg"
            emptyText="Ningún producto tiene varias presentaciones"
          />
        )}
      </Field>
      <Field
        label="Cantidad que se abre"
        required
        error={errors.fromQuantity?.message}
        hint={
          from ? `Disponible: ${formatQty(available(from.variantId), from.unitSymbol)}` : undefined
        }
      >
        {(p) => (
          <DecimalInput {...p} {...form.register("fromQuantity")} suffix={from?.unitSymbol} />
        )}
      </Field>
      <Field label="Presentación que resulta" required error={errors.toVariantId?.message}>
        {(p) => (
          <Combobox
            id={p.id}
            invalid={p["aria-invalid"]}
            describedBy={p["aria-describedby"]}
            options={toOptions}
            value={toId}
            onChange={(v) => form.setValue("toVariantId", v)}
            placeholder={from ? "Ej.: Kilogramo" : "Primero elige qué se abre"}
          />
        )}
      </Field>
      <Field
        label="Cantidad que resulta"
        required
        error={errors.toQuantity?.message}
        hint={
          maxTo !== null
            ? `Como máximo ${formatQty(maxTo, to?.unitSymbol)}; la diferencia se registra como merma.`
            : undefined
        }
      >
        {(p) => <DecimalInput {...p} {...form.register("toQuantity")} suffix={to?.unitSymbol} />}
      </Field>
    </fieldset>
  );
}
