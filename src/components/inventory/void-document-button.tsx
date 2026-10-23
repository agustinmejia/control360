"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { voidDocument } from "@/modules/inventory/actions";

export function VoidDocumentButton({ documentId, label }: { documentId: string; label: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();

  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        Anular
      </Button>
      <ConfirmDialog
        open={open}
        title={`¿Anular ${label}?`}
        description="Se registrará un documento inverso con fecha de hoy que revierte las existencias. El original se conserva marcado como anulado."
        confirmLabel="Anular"
        requireReason
        loading={pending}
        onCancel={() => setOpen(false)}
        onConfirm={(reason) =>
          startTransition(async () => {
            const result = await voidDocument({ documentId, reason });
            if (result.ok) {
              setOpen(false);
              toast.success("Documento anulado.");
              router.refresh();
            } else {
              toast.error(result.error.fieldErrors?.reason?.[0] ?? result.error.message);
            }
          })
        }
      />
    </>
  );
}
