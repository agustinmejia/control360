"use client";

import Link from "next/link";
import { useState } from "react";
import { useActionForm } from "@/components/forms/use-action-form";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { requestPasswordReset } from "@/modules/auth/actions";
import { passwordResetRequestSchema } from "@/modules/auth/schemas";

export function ResetRequestForm() {
  const [sent, setSent] = useState(false);
  const { form, onSubmit, pending, errors } = useActionForm({
    schema: passwordResetRequestSchema,
    action: requestPasswordReset,
    defaultValues: { email: "" },
    onSuccess: () => setSent(true),
  });

  if (sent) {
    return (
      <div role="status" className="flex flex-col gap-3">
        <h1 className="text-xl font-bold">Revisa tu correo</h1>
        <p className="text-muted">
          Si el correo está registrado, recibirás un enlace para crear una nueva contraseña. El
          enlace vence en una hora.
        </p>
        <Link href="/login" className="text-primary font-medium underline-offset-4 hover:underline">
          Volver a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Recuperar contraseña</h1>
      <p className="text-muted text-sm">Te enviaremos un enlace para crear una contraseña nueva.</p>
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
      <Button type="submit" loading={pending} fullWidth>
        Enviar enlace
      </Button>
      <Link
        href="/login"
        className="text-primary text-center text-sm font-medium underline-offset-4 hover:underline"
      >
        Volver a iniciar sesión
      </Link>
    </form>
  );
}
