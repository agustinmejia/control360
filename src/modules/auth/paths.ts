/** Rutas accesibles sin sesión. */
const PUBLIC_PREFIXES = ["/login", "/recuperar-contrasena", "/auth/", "/cuenta-desactivada"];

/** Rutas que no tienen sentido con la sesión iniciada. */
const GUEST_ONLY = ["/login", "/recuperar-contrasena"];

export function isPublicPath(pathname: string, { devUi = false } = {}): boolean {
  if (devUi && (pathname === "/dev/ui" || pathname.startsWith("/dev/"))) return true;
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p.endsWith("/") ? p : `${p}/`),
  );
}

export function isGuestOnlyPath(pathname: string): boolean {
  return GUEST_ONLY.includes(pathname);
}

/**
 * Normaliza el parámetro `next` para evitar redirecciones abiertas: solo rutas internas.
 */
export function safeNextPath(next: string | null | undefined, fallback = "/"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\"))
    return fallback;
  if (isGuestOnlyPath(next.split("?")[0] ?? "")) return fallback;
  return next;
}
