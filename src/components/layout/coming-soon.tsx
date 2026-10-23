import { Construction } from "lucide-react";
import type { NavItem } from "@/config/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";

export function ComingSoon({ item }: { item: NavItem }) {
  return (
    <>
      <PageHeader title={item.label} description={item.description} />
      <EmptyState
        icon={<Construction className="size-8" />}
        title="Módulo en preparación"
        description={`Se entrega en el bloque ${item.block} del roadmap. Mientras tanto, sigue usándose el prototipo.`}
      />
    </>
  );
}
