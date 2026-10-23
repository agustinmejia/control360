import { NAV_ITEMS, type NavItem } from "@/config/navigation";
import { can, type AppRole } from "./roles";

/** Módulos visibles para un rol. */
export function navItemsFor(role: AppRole): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.permission || can(role, item.permission));
}
