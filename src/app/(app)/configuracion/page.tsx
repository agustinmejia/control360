import type { Metadata } from "next";
import Link from "next/link";
import { Boxes, Building2, History, ListTree, Store, Users } from "lucide-react";
import { NoPermission } from "@/components/layout/no-permission";
import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/modules/access/session";

export const metadata: Metadata = { title: "Configuración" };

const SECTIONS = [
  {
    href: "/configuracion/empresa",
    label: "Empresa",
    description: "Nombre, datos fiscales y reglas generales",
    icon: Building2,
  },
  {
    href: "/configuracion/sucursales",
    label: "Sucursales",
    description: "Sucursales donde se ubican los inventarios",
    icon: Store,
  },
  {
    href: "/configuracion/inventarios",
    label: "Inventarios",
    description: "Inventarios de cada sucursal",
    icon: Boxes,
  },
  {
    href: "/configuracion/catalogos",
    label: "Catálogos",
    description: "Categorías, unidades de medida y motivos",
    icon: ListTree,
  },
  {
    href: "/configuracion/usuarios",
    label: "Usuarios",
    description: "Invitaciones, roles y acceso por sucursal",
    icon: Users,
  },
  {
    href: "/configuracion/bitacora",
    label: "Bitácora de acciones",
    description: "Quién hizo qué y cuándo; acciones críticas",
    icon: History,
  },
];

export default async function SettingsPage() {
  if (!(await requirePermission("settings.manage"))) return <NoPermission />;
  return (
    <>
      <PageHeader title="Configuración" />
      <ul className="grid gap-3 sm:grid-cols-2">
        {SECTIONS.map(({ href, label, description, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="border-border bg-surface hover:bg-surface-muted flex h-full items-start gap-3 rounded-lg border p-4"
            >
              <Icon className="text-primary mt-0.5 size-6 shrink-0" aria-hidden />
              <span>
                <span className="block font-bold">{label}</span>
                <span className="text-muted mt-1 block text-sm">{description}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
