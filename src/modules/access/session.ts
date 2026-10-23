import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { can, type AppRole, type Permission } from "./roles";

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
  role: AppRole;
  isActive: boolean;
};

/**
 * Usuario de la solicitud actual (memorizado por solicitud). `null` si no hay sesión.
 * La sesión se valida con `getClaims()` (firma del JWT), no con datos de la cookie sin verificar.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, is_active")
    .eq("id", userId)
    .maybeSingle();

  // Sin perfil visible = usuario desactivado (RLS oculta todo a los inactivos).
  if (!profile) {
    return {
      id: userId,
      email: String(data.claims.email ?? ""),
      fullName: "",
      role: "viewer",
      isActive: false,
    };
  }
  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role,
    isActive: profile.is_active,
  };
});

/** Exige sesión activa; si no, redirige al inicio de sesión. */
export async function requireUser(nextPath?: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login");
  if (!user.isActive) redirect("/cuenta-desactivada");
  return user;
}

/** Exige un permiso. Devuelve el usuario o `null` si no lo tiene (la página muestra "Sin permiso"). */
export async function requirePermission(permission: Permission): Promise<CurrentUser | null> {
  const user = await requireUser();
  return can(user.role, permission) ? user : null;
}

/** Nombre comercial (visible sin sesión). */
export const getCompanyName = cache(async (): Promise<string> => {
  if (!isSupabaseConfigured()) return "Grupo Pecuario";
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.rpc("public_company_info");
    return data?.[0]?.name ?? "Grupo Pecuario";
  } catch {
    return "Grupo Pecuario";
  }
});
