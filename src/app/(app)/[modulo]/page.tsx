import { notFound } from "next/navigation";
import Link from "next/link";
import { UserRound } from "lucide-react";
import { NAV_ITEMS, findNavItem } from "@/config/navigation";
import { navItemsFor } from "@/modules/access/navigation";
import { requireUser } from "@/modules/access/session";
import { ComingSoon } from "@/components/layout/coming-soon";
import { PageHeader } from "@/components/ui/page-header";

// Marcadores de los módulos aún no construidos. Cada módulo reemplaza esta ruta con la suya.
export function generateStaticParams() {
  return [
    ...NAV_ITEMS.filter((i) => i.slug && !i.available).map((i) => ({ modulo: i.slug })),
    { modulo: "mas" },
  ];
}

export async function generateMetadata(props: PageProps<"/[modulo]">) {
  const { modulo } = await props.params;
  return { title: modulo === "mas" ? "Más" : (findNavItem(modulo)?.label ?? "No encontrado") };
}

export default async function ModulePlaceholder(props: PageProps<"/[modulo]">) {
  const { modulo } = await props.params;

  if (modulo === "mas") {
    const user = await requireUser();
    const others = [
      ...navItemsFor(user.role).filter((i) => !i.mobile),
      { slug: "perfil", href: "/perfil", label: "Mi perfil", icon: UserRound, available: true },
    ];
    return (
      <>
        <PageHeader title="Más módulos" />
        <ul className="flex flex-col gap-2">
          {others.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.slug}>
                <Link
                  href={item.href}
                  className="border-border bg-surface hover:bg-surface-muted flex min-h-14 items-center gap-3 rounded-lg border px-4"
                >
                  <Icon className="text-primary size-5" aria-hidden />
                  <span className="flex-1 font-semibold">{item.label}</span>
                  {!item.available && <span className="text-muted text-xs">Pronto</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </>
    );
  }

  const item = findNavItem(modulo);
  if (!item || item.available) notFound();
  return <ComingSoon item={item} />;
}
