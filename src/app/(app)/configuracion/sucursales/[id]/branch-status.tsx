"use client";

import { ActiveToggle } from "@/components/settings/active-toggle";
import { setBranchActive } from "@/modules/settings/actions";

export function BranchStatus({
  id,
  active,
  reason,
}: {
  id: string;
  active: boolean;
  reason: string | null;
}) {
  return (
    <ActiveToggle
      active={active}
      reason={reason}
      noun="Sucursal"
      consequence="No se podrá operar en sus inventarios. El historial se conserva y se puede reactivar."
      action={(input) => setBranchActive({ id, ...input })}
    />
  );
}
