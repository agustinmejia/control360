"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getPublicEnv } from "@/lib/env";
import { AppError, fromPostgrestError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { runAction } from "@/lib/result";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fromAuthError } from "./auth-errors";
import { safeNextPath } from "./paths";
import {
  newPasswordSchema,
  passwordResetRequestSchema,
  profileSchema,
  signInSchema,
} from "./schemas";

export async function signIn(input: unknown) {
  return runAction(signInSchema, input, async ({ email, password, next }) => {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw fromAuthError(error);

    const { error: logError } = await supabase.rpc("log_sign_in");
    if (logError) logger.warn("No se pudo registrar el inicio de sesión", { code: logError.code });

    return { redirectTo: safeNextPath(next) };
  });
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/** Siempre responde igual, exista o no la cuenta (no revela qué correos están registrados). */
export async function requestPasswordReset(input: unknown) {
  return runAction(passwordResetRequestSchema, input, async ({ email }) => {
    const supabase = await createSupabaseServerClient();
    const siteUrl = getPublicEnv().NEXT_PUBLIC_SITE_URL;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/confirm?next=/actualizar-contrasena`,
    });
    if (
      error &&
      (error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit")
    ) {
      throw fromAuthError(error);
    }
    if (error) logger.warn("Error al solicitar recuperación de contraseña", { code: error.code });
    return { sent: true };
  });
}

export async function updatePassword(input: unknown) {
  return runAction(newPasswordSchema, input, async ({ password }) => {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getClaims();
    if (!data?.claims?.sub) throw new AppError("UNAUTHENTICATED");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw fromAuthError(error);
    return { redirectTo: "/" };
  });
}

export async function updateProfile(input: unknown) {
  return runAction(profileSchema, input, async ({ fullName, phone }) => {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;
    if (!userId) throw new AppError("UNAUTHENTICATED");
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone })
      .eq("id", userId);
    if (error) throw fromPostgrestError(error);
    revalidatePath("/", "layout");
    return { saved: true };
  });
}
