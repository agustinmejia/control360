import { ShieldAlert } from "lucide-react";
import { EmptyState } from "@/components/ui/states";

export function NoPermission() {
  return (
    <EmptyState
      icon={<ShieldAlert className="size-8" />}
      title="No tienes permiso para ver esta sección"
      description="Si lo necesitas, pídeselo al propietario o al administrador."
    />
  );
}
