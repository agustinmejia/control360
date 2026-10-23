"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/ui/cn";

const TABS = [
  { href: "/inventario", label: "Existencias" },
  { href: "/inventario/movimientos", label: "Movimientos" },
  { href: "/inventario/kardex", label: "Kardex" },
  { href: "/inventario/productos", label: "Productos" },
];

export function InventoryTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Secciones de inventario" className="no-print -mx-4 mb-4 overflow-x-auto px-4">
      <ul className="border-border flex min-w-max gap-1 border-b">
        {TABS.map((tab) => {
          const active =
            tab.href === "/inventario" ? pathname === tab.href : pathname.startsWith(tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center border-b-2 px-3 text-[15px]",
                  active
                    ? "border-primary text-primary font-semibold"
                    : "text-muted hover:text-foreground border-transparent",
                )}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
