import type { Database } from "@/lib/supabase/database.types";

export type AppRole = Database["public"]["Enums"]["app_role"];

export const ROLES: readonly AppRole[] = ["owner", "admin", "operator", "viewer"];

export const ROLE_LABELS: Record<AppRole, string> = {
  owner: "Propietario",
  admin: "Administrador",
  operator: "Operador",
  viewer: "Consulta",
};

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  owner: "Acceso total, incluida la gestión de propietarios.",
  admin: "Todo, salvo gestionar propietarios.",
  operator: "Operación diaria: ventas, cobros, compras y movimientos.",
  viewer: "Solo consulta, sin registrar ni modificar.",
};

/**
 * Permisos de la interfaz. Son un ESPEJO de las reglas de la base de datos (RLS y RPC),
 * que siguen siendo las que deciden: aquí solo se usan para mostrar u ocultar acciones.
 */
export type Permission =
  | "settings.manage" // empresa y sucursales
  | "users.manage" // invitar, cambiar rol, desactivar
  | "audit.read" // bitácora de acciones
  | "operations.write" // registrar ventas, cobros, compras, movimientos (B3+)
  | "operations.read";

const MATRIX: Record<Permission, readonly AppRole[]> = {
  "settings.manage": ["owner", "admin"],
  "users.manage": ["owner", "admin"],
  "audit.read": ["owner", "admin"],
  "operations.write": ["owner", "admin", "operator"],
  "operations.read": ["owner", "admin", "operator", "viewer"],
};

export function can(role: AppRole | null | undefined, permission: Permission): boolean {
  return role ? MATRIX[permission].includes(role) : false;
}

/** Roles que el usuario actual puede asignar a otros. */
export function assignableRoles(role: AppRole | null | undefined): AppRole[] {
  if (role === "owner") return [...ROLES];
  if (role === "admin") return ROLES.filter((r) => r !== "owner");
  return [];
}

/** ¿Puede el usuario actual administrar a este usuario? (misma regla que la BD) */
export function canManageUser(
  actor: { id: string; role: AppRole } | null,
  target: { id: string; role: AppRole },
): boolean {
  if (!actor || actor.id === target.id || !can(actor.role, "users.manage")) return false;
  return actor.role === "owner" || target.role !== "owner";
}
