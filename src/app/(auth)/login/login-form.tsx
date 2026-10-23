"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionForm } from "@/components/forms/use-action-form";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signIn } from "@/modules/auth/actions";
import { signInSchema } from "@/modules/auth/schemas";

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const { form, onSubmit, pending, errors } = useActionForm({
    schema: signInSchema,
    action: signIn,
    defaultValues: { email: "", password: "", next },
    onSuccess: ({ redirectTo }) => {
      router.replace(redirectTo);
      router.refresh();
    },
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Iniciar sesión</h1>
      <Field label="Correo electrónico" error={errors.email?.message}>
        {(p) => (
          <Input
            {...p}
            {...form.register("email")}
            type="email"
            autoComplete="username"
            inputMode="email"
          />
        )}
      </Field>
      <Field label="Contraseña" error={errors.password?.message}>
        {(p) => (
          <Input
            {...p}
            {...form.register("password")}
            type="password"
            autoComplete="current-password"
          />
        )}
      </Field>
      <Button type="submit" loading={pending} fullWidth>
        Ingresar
      </Button>
      <Link
        href="/recuperar-contrasena"
        className="text-primary text-center text-sm font-medium underline-offset-4 hover:underline"
      >
        ¿Olvidaste tu contraseña?
      </Link>
    </form>
  );
}
