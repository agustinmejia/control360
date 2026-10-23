import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicEnv, isSupabaseConfigured } from "@/lib/env";
import { logger } from "@/lib/logger";

/**
 * Refresca la sesión de Supabase en cada solicitud y propaga las cookies.
 * La protección de rutas por usuario se agrega en el Bloque 2 (EPIC-006).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured()) return response;

  const env = getPublicEnv();
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    },
  );

  try {
    // Debe ejecutarse antes de generar la respuesta para no perder un token refrescado.
    await supabase.auth.getClaims();
  } catch (error) {
    logger.warn("No se pudo verificar la sesión de Supabase", { error });
  }

  return response;
}
