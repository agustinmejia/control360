import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicEnv, isSupabaseConfigured } from "@/lib/env";
import { logger } from "@/lib/logger";

/**
 * Refresca la sesión de Supabase en cada solicitud y propaga las cookies.
 * Devuelve el id del usuario autenticado (validado con la firma del JWT) o `null`.
 */
export async function updateSession(
  request: NextRequest,
): Promise<{ response: NextResponse; userId: string | null }> {
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured()) return { response, userId: null };

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
    const { data } = await supabase.auth.getClaims();
    return { response, userId: data?.claims?.sub ?? null };
  } catch (error) {
    logger.warn("No se pudo verificar la sesión de Supabase", { error });
    return { response, userId: null };
  }
}

/** Redirección que conserva las cookies de sesión ya refrescadas. */
export function redirectWithCookies(
  request: NextRequest,
  from: NextResponse,
  pathname: string,
  params: Record<string, string> = {},
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = new URLSearchParams(params).toString();
  const redirect = NextResponse.redirect(url);
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}
