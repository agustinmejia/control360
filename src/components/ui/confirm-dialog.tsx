"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "./button";
import { Field } from "./field";
import { Textarea } from "./input";

/**
 * Confirmación de acciones sensibles. Con `requireReason`, exige un motivo
 * (anulaciones, ajustes, reaperturas) que se entrega en `onConfirm`.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  tone = "danger",
  requireReason = false,
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  tone?: "danger" | "primary";
  requireReason?: boolean;
  loading?: boolean;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState("");
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const reasonMissing = requireReason && reason.trim().length < 3;

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      className="border-border bg-surface text-foreground m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border p-0 backdrop:bg-black/50"
    >
      <form
        method="dialog"
        className="flex flex-col gap-4 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!reasonMissing) onConfirm(requireReason ? reason.trim() : undefined);
        }}
      >
        <h2 id={titleId} className="text-lg font-semibold">
          {title}
        </h2>
        {description && <p className="text-muted">{description}</p>}
        {requireReason && (
          <Field label="Motivo" required hint="Queda registrado en la bitácora de acciones.">
            {(p) => (
              <Textarea
                {...p}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                autoFocus
              />
            )}
          </Field>
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant={tone} loading={loading} disabled={reasonMissing}>
            {confirmLabel}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
