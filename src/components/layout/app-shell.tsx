"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { MORE_ITEM, NAV_ITEMS, type NavItem } from "@/config/navigation";
import { ROLE_LABELS, type AppRole } from "@/modules/access/roles";
import { signOut } from "@/modules/auth/actions";
import { cn } from "@/lib/ui/cn";
import { ThemeToggle } from "./theme-toggle";

export type ShellUser = { fullName: string; email: string; role: AppRole };

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function initials(user: ShellUser) {
  const source = user.fullName.trim() || user.email;
  const parts = source.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function SidebarLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-lg px-3 text-[15px] transition-colors",
        active
          ? "bg-primary-soft text-primary font-semibold"
          : "text-foreground hover:bg-surface-muted",
      )}
    >
      <Icon className="size-5 shrink-0" aria-hidden />
      <span className="flex-1">{item.label}</span>
      {!item.available && <span className="text-muted text-xs">Pronto</span>}
    </Link>
  );
}

/**
 * Estructura de la app autenticada:
 * - móvil: cabecera compacta + barra de navegación inferior (al alcance del pulgar);
 * - ≥ 1024 px: barra lateral con todos los módulos.
 * `allowedSlugs` llega del servidor ya filtrado por los permisos del usuario
 * (los iconos son componentes y no pueden cruzar del servidor al cliente).
 */
export function AppShell({
  children,
  companyName,
  user,
  allowedSlugs,
}: {
  children: ReactNode;
  companyName: string;
  user: ShellUser;
  allowedSlugs: string[];
}) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => allowedSlugs.includes(item.slug));
  const mobileItems = items.filter((i) => i.mobile);
  const moreActive =
    !mobileItems.some((i) => isActive(pathname, i.href)) && !isActive(pathname, "/perfil");
  const displayName = user.fullName || user.email;

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="no-print border-border bg-surface sticky top-0 hidden h-dvh flex-col gap-1 overflow-y-auto border-r p-3 lg:flex">
        <div className="mb-3 px-3 pt-2">
          <p className="text-xl font-extrabold tracking-tight">Control360</p>
          <p className="text-muted text-sm">{companyName}</p>
        </div>
        <nav aria-label="Navegación principal" className="flex flex-1 flex-col gap-1">
          {items.map((item) => (
            <SidebarLink key={item.slug} item={item} active={isActive(pathname, item.href)} />
          ))}
        </nav>
        <div className="border-border mt-2 flex flex-col gap-1 border-t pt-3">
          <Link
            href="/perfil"
            aria-current={isActive(pathname, "/perfil") ? "page" : undefined}
            className="hover:bg-surface-muted flex min-h-12 items-center gap-3 rounded-lg px-3"
          >
            <span
              className="bg-primary-soft text-primary flex size-9 items-center justify-center rounded-full text-sm font-bold"
              aria-hidden
            >
              {initials(user)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{displayName}</span>
              <span className="text-muted block text-xs">{ROLE_LABELS[user.role]}</span>
            </span>
          </Link>
          <div className="flex items-center justify-between">
            <ThemeToggle />
            <form action={signOut}>
              <button
                type="submit"
                className="text-muted hover:bg-surface-muted hover:text-foreground inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm"
              >
                <LogOut className="size-4" aria-hidden />
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="no-print border-border bg-surface/95 sticky top-0 z-30 flex items-center justify-between gap-2 border-b px-4 pt-[env(safe-area-inset-top)] backdrop-blur lg:hidden">
          <div className="min-w-0 py-2">
            <p className="text-lg leading-tight font-extrabold tracking-tight">Control360</p>
            <p className="text-muted truncate text-xs">{companyName}</p>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Link
              href="/perfil"
              aria-label={`Mi perfil (${displayName})`}
              className="flex size-11 items-center justify-center"
            >
              <span className="bg-primary-soft text-primary flex size-9 items-center justify-center rounded-full text-sm font-bold">
                {initials(user)}
              </span>
            </Link>
          </div>
        </header>

        <main
          id="contenido"
          className="mx-auto w-full max-w-6xl flex-1 px-4 pt-4 pb-28 lg:px-8 lg:pt-8 lg:pb-10"
        >
          {children}
        </main>

        <nav
          aria-label="Navegación principal"
          className="no-print border-border bg-surface fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t pb-[env(safe-area-inset-bottom)] lg:hidden"
        >
          {[...mobileItems, MORE_ITEM].map((item) => {
            const Icon = item.icon;
            const active =
              item.slug === MORE_ITEM.slug ? moreActive : isActive(pathname, item.href);
            return (
              <Link
                key={item.slug}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs",
                  active
                    ? "text-primary font-semibold shadow-[inset_0_3px_0_var(--primary)]"
                    : "text-muted",
                )}
              >
                <Icon className="size-5" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
