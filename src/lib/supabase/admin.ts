import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getPublicEnv } from "@/lib/env";
import { AppError } from "@/lib/errors";
import type { Database } from "@/lib/supabase/database.types";

/** ¿Está configurada la clave secreta? (necesaria para invitar y bloquear usuarios) */
export function isAdminConfigured(): boolean {
  return Boolean(process.env.SUPABASE_SECRET_KEY);
}

/**
 * Cliente con la clave secreta: IGNORA RLS. Usar solo en el servidor, solo para la API de
 * administración de Auth (invitar, bloquear) y siempre después de verificar el rol del
 * usuario con su propia sesión. Nunca para leer o escribir datos de negocio.
 */
export function createSupabaseAdminClient() {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) {
    throw new AppError(
      "UNEXPECTED",
      "Falta SUPABASE_SECRET_KEY en el servidor: no se pueden gestionar invitaciones.",
    );
  }
  return createClient<Database>(getPublicEnv().NEXT_PUBLIC_SUPABASE_URL, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
