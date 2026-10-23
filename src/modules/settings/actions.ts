"use server";

import { revalidatePath } from "next/cache";
import { getPublicEnv } from "@/lib/env";
import { AppError, fromPostgrestError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { runAction } from "@/lib/result";
import { createSupabaseAdminClient, isAdminConfigured } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { can, type AppRole, type Permission } from "@/modules/access/roles";
import { getCurrentUser } from "@/modules/access/session";
import {
  branchActiveSchema,
  branchSchema,
  companySchema,
  inviteSchema,
  userActiveSchema,
  userBranchesSchema,
  userRoleSchema,
} from "./schemas";

/** Verificación previa en el servidor (la BD vuelve a verificar con RLS/RPC). */
async function authorize(permission: Permission) {
  const user = await getCurrentUser();
  if (!user || !user.isActive) throw new AppError("UNAUTHENTICATED");
  if (!can(user.role, permission)) throw new AppError("FORBIDDEN");
  return { user, supabase: await createSupabaseServerClient() };
}

export async function updateCompany(input: unknown) {
  return runAction(companySchema, input, async (data) => {
    const { supabase } = await authorize("settings.manage");
    const { error } = await supabase
      .from("company_settings")
      .update({
        name: data.name,
        legal_name: data.legalName,
        tax_id: data.taxId,
        phone: data.phone,
        address: data.address,
        backdate_limit_days: data.backdateLimitDays,
      })
      .eq("id", true);
    if (error) throw fromPostgrestError(error);
    revalidatePath("/", "layout");
    return { saved: true };
  });
}

export async function saveBranch(input: unknown) {
  return runAction(branchSchema, input, async ({ id, ...fields }) => {
    const { supabase } = await authorize("settings.manage");
    const query = id
      ? supabase.from("branches").update(fields).eq("id", id).select("id").single()
      : supabase.from("branches").insert(fields).select("id").single();
    const { data, error } = await query;
    if (error) {
      if (error.code === "23505")
        throw new AppError("DUPLICATE", "Ya existe una sucursal con ese nombre.");
      throw fromPostgrestError(error);
    }
    revalidatePath("/configuracion/sucursales");
    return { id: data.id };
  });
}

export async function setBranchActive(input: unknown) {
  return runAction(branchActiveSchema, input, async ({ id, active, reason }) => {
    const { supabase } = await authorize("settings.manage");
    const { error } = await supabase.rpc("set_branch_active", {
      p_branch: id,
      p_active: active,
      p_reason: reason,
    });
    if (error) throw fromPostgrestError(error);
    revalidatePath("/configuracion/sucursales");
    return { active };
  });
}

/**
 * Invita por correo. Requiere SUPABASE_SECRET_KEY (API de administración de Auth).
 * El rol se asigna con la sesión de quien invita, así la bitácora registra al autor.
 */
export async function inviteUser(input: unknown) {
  return runAction(inviteSchema, input, async ({ email, fullName, role, branchIds }) => {
    const { user, supabase } = await authorize("users.manage");
    if (role === "owner" && user.role !== "owner") {
      throw new AppError("FORBIDDEN", "Solo un propietario puede invitar propietarios.");
    }
    if (!isAdminConfigured()) {
      throw new AppError(
        "UNEXPECTED",
        "Las invitaciones requieren configurar SUPABASE_SECRET_KEY en el servidor.",
      );
    }
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName },
      redirectTo: `${getPublicEnv().NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/actualizar-contrasena`,
    });
    if (error) {
      if (error.code === "email_exists" || error.status === 422) {
        throw new AppError("DUPLICATE", "Ya existe un usuario con ese correo.");
      }
      logger.error("No se pudo enviar la invitación", { code: error.code, status: error.status });
      throw new AppError("UNEXPECTED", "No se pudo enviar la invitación. Inténtalo más tarde.");
    }

    const newUserId = data.user.id;
    const { error: roleError } = await supabase.rpc("admin_set_user_role", {
      p_user: newUserId,
      p_role: role as AppRole,
      p_reason: "Invitación",
    });
    if (roleError) throw fromPostgrestError(roleError);
    if (branchIds.length) {
      const { error: branchError } = await supabase.rpc("admin_set_user_branches", {
        p_user: newUserId,
        p_branches: branchIds,
      });
      if (branchError) throw fromPostgrestError(branchError);
    }
    revalidatePath("/configuracion/usuarios");
    return { id: newUserId };
  });
}

export async function setUserRole(input: unknown) {
  return runAction(userRoleSchema, input, async ({ userId, role, reason }) => {
    const { supabase } = await authorize("users.manage");
    const { error } = await supabase.rpc("admin_set_user_role", {
      p_user: userId,
      p_role: role as AppRole,
      p_reason: reason,
    });
    if (error) throw fromPostgrestError(error);
    revalidatePath("/configuracion/usuarios");
    return { role };
  });
}

/**
 * Desactivar = borrado lógico en la BD (RLS deja de mostrarle datos de inmediato) y,
 * si hay clave de administración, bloqueo del inicio de sesión en Auth.
 */
export async function setUserActive(input: unknown) {
  return runAction(userActiveSchema, input, async ({ userId, active, reason }) => {
    const { supabase } = await authorize("users.manage");
    const { error } = await supabase.rpc("admin_set_user_active", {
      p_user: userId,
      p_active: active,
      p_reason: reason,
    });
    if (error) throw fromPostgrestError(error);

    let loginBlocked = false;
    if (isAdminConfigured()) {
      const { error: banError } = await createSupabaseAdminClient().auth.admin.updateUserById(
        userId,
        {
          ban_duration: active ? "none" : "876000h",
        },
      );
      if (banError)
        logger.error("No se pudo actualizar el bloqueo en Auth", { code: banError.code });
      loginBlocked = !active && !banError;
    }
    revalidatePath("/configuracion/usuarios");
    return { active, loginBlocked };
  });
}

export async function setUserBranches(input: unknown) {
  return runAction(userBranchesSchema, input, async ({ userId, branchIds }) => {
    const { supabase } = await authorize("users.manage");
    const { error } = await supabase.rpc("admin_set_user_branches", {
      p_user: userId,
      p_branches: branchIds,
    });
    if (error) throw fromPostgrestError(error);
    revalidatePath("/configuracion/usuarios");
    return { count: branchIds.length };
  });
}
