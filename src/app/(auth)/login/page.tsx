import type { Metadata } from "next";
import { isSupabaseConfigured } from "@/lib/env";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Iniciar sesión" };

const MESSAGES: Record<string, string> = {
  enlace: "El enlace no es válido o ya expiró. Pide uno nuevo.",
  sesion: "Tu sesión terminó. Vuelve a ingresar.",
};

export default async function LoginPage(props: PageProps<"/login">) {
  const { next, error } = await props.searchParams;
  const message = typeof error === "string" ? MESSAGES[error] : undefined;

  return (
    <>
      {!isSupabaseConfigured() && (
        <p role="alert" className="bg-warning-soft text-warning mb-4 rounded-lg p-3 text-sm">
          Supabase no está configurado. Completa las variables de <code>.env.example</code>.
        </p>
      )}
      {message && (
        <p role="alert" className="bg-danger-soft text-danger mb-4 rounded-lg p-3 text-sm">
          {message}
        </p>
      )}
      <LoginForm next={typeof next === "string" ? next : undefined} />
    </>
  );
}
