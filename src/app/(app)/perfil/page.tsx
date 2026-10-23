import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from "@/modules/access/roles";
import { requireUser } from "@/modules/access/session";
import { signOut } from "@/modules/auth/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Mi perfil" };

export default async function ProfilePage() {
  const user = await requireUser("/perfil");
  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("phone")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <>
      <PageHeader title="Mi perfil" description={user.email} />
      <div className="flex flex-col gap-4">
        <Card>
          <CardTitle>Datos personales</CardTitle>
          <ProfileForm fullName={user.fullName} phone={profile?.phone ?? ""} />
        </Card>
        <Card>
          <CardTitle>Rol</CardTitle>
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="success">{ROLE_LABELS[user.role]}</Badge>
            <span className="text-muted text-sm">{ROLE_DESCRIPTIONS[user.role]}</span>
          </div>
          <p className="text-muted mt-2 text-sm">
            El rol lo asigna el propietario o el administrador.
          </p>
        </Card>
        <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="mb-1">Seguridad</CardTitle>
            <p className="text-muted text-sm">
              Cambia tu contraseña o cierra la sesión en este dispositivo.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/actualizar-contrasena"
              className="border-border hover:bg-surface-muted inline-flex min-h-11 items-center rounded-lg border px-4 font-semibold"
            >
              Cambiar contraseña
            </Link>
            <form action={signOut}>
              <Button type="submit" variant="secondary">
                Cerrar sesión
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </>
  );
}
