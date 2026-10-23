"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import type { Result } from "@/lib/result";

/**
 * Activar / desactivar (borrado lógico). Desactivar pide confirmación y motivo,
 * que queda en la bitácora.
 */
export function ActiveToggle<T>({
  active,
  noun,
  consequence,
  reason,
  disabled,
  action,
}: {
  active: boolean;
  noun: string;
  consequence: string;
  reason?: string | null;
  disabled?: boolean;
  action: (input: { active: boolean; reason?: string }) => Promise<Result<T>>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();

  const run = (nextActive: boolean, why?: string) =>
    startTransition(async () => {
      const result = await action({ active: nextActive, reason: why });
      if (result.ok) {
        setOpen(false);
        toast.success(nextActive ? `${noun} reactivado.` : `${noun} desactivado.`);
        router.refresh();
      } else {
        toast.error(result.error.fieldErrors?.reason?.[0] ?? result.error.message);
      }
    });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={active ? "success" : "danger"}>{active ? "Activo" : "Desactivado"}</Badge>
        {!active && reason && <span className="text-muted text-sm">Motivo: {reason}</span>}
      </div>
      {active ? (
        <Button
          variant="danger"
          className="self-start"
          disabled={disabled}
          onClick={() => setOpen(true)}
        >
          Desactivar
        </Button>
      ) : (
        <Button
          variant="secondary"
          className="self-start"
          disabled={disabled}
          loading={pending}
          onClick={() => run(true)}
        >
          Reactivar
        </Button>
      )}
      <ConfirmDialog
        open={open}
        title={`¿Desactivar ${noun.toLowerCase()}?`}
        description={consequence}
        confirmLabel="Desactivar"
        requireReason
        loading={pending}
        onCancel={() => setOpen(false)}
        onConfirm={(why) => run(false, why)}
      />
    </div>
  );
}
