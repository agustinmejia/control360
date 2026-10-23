import type { NextRequest } from "next/server";
import { redirectWithCookies, updateSession } from "@/lib/supabase/proxy";
import { isGuestOnlyPath, isPublicPath } from "@/modules/auth/paths";

/**
 * 1) Refresca la sesión de Supabase. 2) Redirige a /login las rutas privadas sin sesión.
 * Es una verificación optimista: cada página y cada acción vuelve a validar el usuario,
 * y la base de datos (RLS) es la protección definitiva.
 */
export async function proxy(request: NextRequest) {
  const { response, userId } = await updateSession(request);
  const { pathname, search } = request.nextUrl;
  const devUi = process.env.VERCEL_ENV !== "production";

  if (!userId && !isPublicPath(pathname, { devUi })) {
    const params: Record<string, string> = pathname === "/" ? {} : { next: pathname + search };
    return redirectWithCookies(request, response, "/login", params);
  }
  if (userId && isGuestOnlyPath(pathname)) {
    return redirectWithCookies(request, response, "/");
  }
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: [
    // Todo excepto recursos estáticos, imágenes, manifiesto e iconos.
    "/((?!_next/static|_next/image|favicon.ico|icon.png|manifest.webmanifest|icons/|brand-logo|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
