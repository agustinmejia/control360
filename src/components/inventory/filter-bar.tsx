import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/** Filtros por URL (GET): funcionan sin JavaScript y se pueden compartir como enlace. */
export function FilterBar({ children, resetHref }: { children: ReactNode; resetHref: string }) {
  return (
    <Card className="no-print mb-4">
      <form method="get" className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {children}
        <div className="flex gap-2">
          <Button type="submit">Filtrar</Button>
          <Link
            href={resetHref}
            className="text-muted hover:bg-surface-muted inline-flex min-h-11 items-center rounded-lg px-3 font-semibold"
          >
            Limpiar
          </Link>
        </div>
      </form>
    </Card>
  );
}

export function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="text-muted flex flex-col gap-1.5 text-sm font-medium">
      {label}
      {children}
    </label>
  );
}
