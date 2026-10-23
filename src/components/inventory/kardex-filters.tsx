"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Field } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";

export function KardexFilters({
  products,
  inventories,
  initial,
}: {
  products: ComboboxOption[];
  inventories: { id: string; label: string }[];
  initial: { variantId?: string; inventoryId?: string; from?: string; to?: string };
}) {
  const router = useRouter();
  const [variantId, setVariantId] = useState(initial.variantId ?? "");
  const [inventoryId, setInventoryId] = useState(initial.inventoryId ?? inventories[0]?.id ?? "");
  const [from, setFrom] = useState(initial.from ?? "");
  const [to, setTo] = useState(initial.to ?? "");

  return (
    <Card className="no-print mb-4">
      <form
        className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1.5fr_1fr_1fr_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          const params = new URLSearchParams(
            Object.entries({
              variante: variantId,
              inventario: inventoryId,
              desde: from,
              hasta: to,
            }).filter(([, v]) => v),
          );
          router.push(`/inventario/kardex?${params}`);
        }}
      >
        <Field label="Producto">
          {(p) => (
            <Combobox
              id={p.id}
              options={products}
              value={variantId}
              onChange={setVariantId}
              placeholder="Buscar producto…"
            />
          )}
        </Field>
        <Field label="Inventario">
          {(p) => (
            <Select {...p} value={inventoryId} onChange={(e) => setInventoryId(e.target.value)}>
              {inventories.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Desde">
          {(p) => (
            <Input {...p} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          )}
        </Field>
        <Field label="Hasta">
          {(p) => <Input {...p} type="date" value={to} onChange={(e) => setTo(e.target.value)} />}
        </Field>
        <Button type="submit" disabled={!variantId || !inventoryId}>
          Ver kardex
        </Button>
      </form>
    </Card>
  );
}
