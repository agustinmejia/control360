import type { Metadata } from "next";
import { requireUser } from "@/modules/access/session";
import { NewPasswordForm } from "./new-password-form";

export const metadata: Metadata = { title: "Crear contraseña" };

/** Se llega desde el enlace de invitación o de recuperación (ya con sesión iniciada). */
export default async function NewPasswordPage() {
  const user = await requireUser("/actualizar-contrasena");
  return <NewPasswordForm email={user.email} />;
}
