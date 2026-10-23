import { Badge } from "@/components/ui/badge";

const STATUS = {
  active: { tone: "success", label: "Activo" },
  pending: { tone: "warning", label: "Invitación pendiente" },
  inactive: { tone: "danger", label: "Desactivado" },
} as const;

export function UserStatusBadge({ status }: { status: keyof typeof STATUS }) {
  const s = STATUS[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}
