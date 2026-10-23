import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight } from "lucide-react";
import { NAV_ITEMS } from "@/config/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { businessToday, formatDate } from "@/lib/dates";

export default async function HomePage() {
  await connection(); // la fecha de hoy se calcula en cada solicitud, no en el build
  const modules = NAV_ITEMS.filter((i) => i.slug !== "");
  return (
    <>
      <PageHeader title="Inicio" description={`Hoy, ${formatDate(businessToday())}`} />
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {modules.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.slug}>
              <Link
                href={item.href}
                className="border-border border-l-primary bg-surface hover:bg-surface-muted flex h-full items-start gap-3 rounded-lg border border-l-4 p-4"
              >
                <Icon className="text-primary mt-0.5 size-6 shrink-0" aria-hidden />
                <span className="flex-1">
                  <span className="flex items-center justify-between gap-2 font-bold">
                    {item.label}
                    <ArrowRight className="text-muted size-4" aria-hidden />
                  </span>
                  <span className="text-muted mt-1 block text-sm">{item.description}</span>
                  {!item.available && (
                    <span className="text-muted mt-2 block text-xs">
                      Bloque {item.block} · próximamente
                    </span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
