"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ResponsiveTable, type Column } from "@/components/ui/responsive-table";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { formatMoney, formatQty } from "@/lib/format";

type Row = {
  id: string;
  name: string;
  inventory: string;
  qty: number;
  unit: string;
  price: number;
};

const ROWS: Row[] = [
  {
    id: "1",
    name: "Alimento balanceado X · saco 40 kg",
    inventory: "Almacén central",
    qty: 12,
    unit: "sacos",
    price: 310,
  },
  {
    id: "2",
    name: "Alimento balanceado X · kg suelto",
    inventory: "Tienda Trinidad",
    qty: 23.5,
    unit: "kg",
    price: 8.5,
  },
  { id: "3", name: "Sal mineral", inventory: "Almacén central", qty: 1250, unit: "kg", price: 4.2 },
];

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "Producto", cell: (r) => r.name, primary: true },
  { key: "inv", header: "Inventario", cell: (r) => r.inventory },
  { key: "qty", header: "Existencia", cell: (r) => formatQty(r.qty, r.unit), align: "right" },
  { key: "price", header: "Precio", cell: (r) => formatMoney(r.price), align: "right" },
];

export function Showcase() {
  const toast = useToast();
  const [dialog, setDialog] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Botones</h2>
        <div className="flex flex-wrap gap-2">
          <Button>Primario</Button>
          <Button variant="secondary">Secundario</Button>
          <Button variant="ghost">Discreto</Button>
          <Button variant="danger">Anular</Button>
          <Button loading>Guardando</Button>
          <Button disabled>Deshabilitado</Button>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Estados y avisos</h2>
        <div className="flex flex-wrap gap-2">
          <Badge>Borrador</Badge>
          <Badge tone="success">Cancelado</Badge>
          <Badge tone="warning">Pendiente</Badge>
          <Badge tone="danger">Anulado</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => toast.success("Venta registrada.")}>
            Aviso de éxito
          </Button>
          <Button
            variant="secondary"
            onClick={() => toast.error("No hay existencias suficientes.")}
          >
            Aviso de error
          </Button>
          <Button variant="secondary" onClick={() => setDialog(true)}>
            Confirmar con motivo
          </Button>
        </div>
        <ConfirmDialog
          open={dialog}
          title="¿Anular la venta N° 128?"
          description="Se registrará un asiento inverso. El stock y el saldo del cliente se restituyen."
          confirmLabel="Anular venta"
          requireReason
          onCancel={() => setDialog(false)}
          onConfirm={(reason) => {
            setDialog(false);
            toast.success(`Anulada. Motivo: ${reason}`);
          }}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Tabla responsive (tarjetas en móvil)</h2>
        <ResponsiveTable
          caption="Existencias de ejemplo"
          columns={COLUMNS}
          rows={ROWS}
          rowKey={(r) => r.id}
        />
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <EmptyState
          title="Sin movimientos"
          description="Registra un ingreso para empezar."
          action={<Button size="sm">Registrar ingreso</Button>}
        />
        <ErrorState onRetry={() => toast.success("Reintentando…")} />
        <LoadingState rows={2} />
      </section>
    </div>
  );
}
