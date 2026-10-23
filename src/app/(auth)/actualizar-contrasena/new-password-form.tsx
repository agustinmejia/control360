"use client";

import { useRouter } from "next/navigation";
import { useActionForm } from "@/components/forms/use-action-form";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { updatePassword } from "@/modules/auth/actions";
import { newPasswordSchema } from "@/modules/auth/schemas";

export function NewPasswordForm({ email }: { email: string }) {
  const router = useRouter();
  const { form, onSubmit, pending, errors } = useActionForm({
    schema: newPasswordSchema,
    action: updatePassword,
    defaultValues: { password: "", confirm: "" },
    successMessage: "Contraseña guardada.",
    onSuccess: ({ redirectTo }) => {
      router.replace(redirectTo);
      router.refresh();
    },
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Crea tu contraseña</h1>
      <p className="text-muted text-sm">Para {email}</p>
      {/* Ayuda a los gestores de contraseñas a asociar la cuenta. */}
      <input type="email" autoComplete="username" value={email} readOnly hidden />
      <Field
        label="Nueva contraseña"
        error={errors.password?.message}
        hint="Mínimo 8 caracteres, con letras y números."
      >
        {(p) => (
          <Input
            {...p}
            {...form.register("password")}
            type="password"
            autoComplete="new-password"
          />
        )}
      </Field>
      <Field label="Repite la contraseña" error={errors.confirm?.message}>
        {(p) => (
          <Input {...p} {...form.register("confirm")} type="password" autoComplete="new-password" />
        )}
      </Field>
      <Button type="submit" loading={pending} fullWidth>
        Guardar contraseña
      </Button>
    </form>
  );
}
