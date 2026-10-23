import { ROLE_LABELS } from "@/modules/access/roles";

/** Textos en español para la bitácora de acciones (enum app.audit_action y módulos). */
export const ACTION_LABELS: Record<string, string> = {
  create: "Creación",
  update: "Modificación",
  void: "Anulación",
  deactivate: "Desactivación",
  reactivate: "Reactivación",
  close: "Cierre",
  reopen: "Reapertura",
  transfer: "Traspaso",
  adjust: "Ajuste",
  convert: "Fraccionamiento",
  price_change: "Cambio de precio",
  role_change: "Cambio de rol",
  login: "Inicio de sesión",
  import: "Importación",
  delete: "Borrado físico",
};

export const MODULE_LABELS: Record<string, string> = {
  security: "Seguridad",
  settings: "Configuración",
  inventory: "Inventario",
  sales: "Ventas",
  receivables: "Cuentas por cobrar",
  purchases: "Compras",
  payables: "Cuentas por pagar",
  cash: "Cargo a rendir",
  livestock: "Ganadería",
  goals: "Metas",
  general: "General",
};

export const ENTITY_LABELS: Record<string, string> = {
  "public.profiles": "Usuario",
  "public.company_settings": "Empresa",
  "public.branches": "Sucursal",
  "public.user_branches": "Sucursales de usuario",
  "auth.users": "Cuenta",
};

/** Nombres de campos para mostrar los cambios. */
export const FIELD_LABELS: Record<string, string> = {
  name: "Nombre",
  full_name: "Nombre",
  legal_name: "Razón social",
  tax_id: "NIT",
  phone: "Teléfono",
  address: "Dirección",
  city: "Ciudad",
  role: "Rol",
  is_active: "Activo",
  deactivation_reason: "Motivo",
  backdate_limit_days: "Días hacia atrás",
  timezone: "Zona horaria",
  email: "Correo",
};

const HIDDEN_FIELDS = new Set(["updated_at", "updated_by", "deactivated_at", "deactivated_by"]);

export function label(map: Record<string, string>, key: string | null | undefined): string {
  if (!key) return "—";
  return map[key] ?? key;
}

/** Cambios visibles "campo: antes → después", omitiendo metadatos técnicos. */
export function describeChanges(
  changedFields: string[] | null,
  oldData: Record<string, unknown> | null,
  newData: Record<string, unknown> | null,
): { field: string; before: string; after: string }[] {
  const show = (field: string, v: unknown) => {
    if (v === null || v === undefined || v === "") return "—";
    if (typeof v === "boolean") return v ? "Sí" : "No";
    if (field === "role") return ROLE_LABELS[v as keyof typeof ROLE_LABELS] ?? String(v);
    return String(v);
  };
  return (changedFields ?? [])
    .filter((f) => !HIDDEN_FIELDS.has(f))
    .map((f) => ({
      field: FIELD_LABELS[f] ?? f,
      before: show(f, oldData?.[f]),
      after: show(f, newData?.[f]),
    }));
}
