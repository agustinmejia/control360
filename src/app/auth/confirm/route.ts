import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/modules/auth/paths";

const OTP_TYPES: EmailOtpType[] = [
  "invite",
  "recovery",
  "signup",
  "magiclink",
  "email_change",
  "email",
];

/**
 * Destino de los enlaces de los correos (invitación, recuperación de contraseña).
 * Plantillas: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/actualizar-contrasena`.
 * También acepta el flujo PKCE (`?code=`).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  const supabase = await createSupabaseServerClient();
  let failed = true;

  if (tokenHash && type && OTP_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    failed = Boolean(error);
    if (error) logger.warn("Enlace de correo inválido", { code: error.code, type });
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    failed = Boolean(error);
    if (error) logger.warn("Código de sesión inválido", { code: error.code });
  }

  if (failed) return NextResponse.redirect(new URL("/login?error=enlace", origin));
  return NextResponse.redirect(new URL(next, origin));
}
