import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { signOut } from "@/modules/auth/actions";

export const metadata: Metadata = { title: "Cuenta desactivada" };

export default function DeactivatedPage() {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-xl font-bold">Cuenta desactivada</h1>
      <p className="text-muted">
        Tu usuario fue desactivado. Si crees que es un error, consulta con el propietario o el
        administrador.
      </p>
      <form action={signOut}>
        <Button type="submit" variant="secondary" fullWidth>
          Cerrar sesión
        </Button>
      </form>
    </div>
  );
}
