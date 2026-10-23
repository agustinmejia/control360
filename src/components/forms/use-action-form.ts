"use client";

import { useTransition } from "react";
import {
  useForm,
  type DefaultValues,
  type FieldValues,
  type Path,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "@/lib/validation";
import { useToast } from "@/components/ui/toast";
import type { Result } from "@/lib/result";

/**
 * Formulario conectado a una Server Action que devuelve `Result<T>`:
 * valida con el mismo esquema Zod en el cliente, envía, aplica los errores de campo
 * del servidor y muestra avisos. Conserva lo escrito si algo falla.
 */
export function useActionForm<S extends z.ZodType<FieldValues, FieldValues>, T>({
  schema,
  action,
  defaultValues,
  successMessage,
  onSuccess,
}: {
  schema: S;
  action: (values: z.input<S>) => Promise<Result<T>>;
  defaultValues: DefaultValues<z.input<S>>;
  successMessage?: string | ((data: T) => string);
  onSuccess?: (data: T) => void;
}) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const form = useForm<z.input<S>>({
    // `raw`: el servidor recibe lo que escribió el usuario y valida con el mismo esquema
    // (si se enviaran los valores ya transformados, la segunda validación fallaría).
    resolver: zodResolver(schema, undefined, { raw: true }) as unknown as Resolver<z.input<S>>,
    defaultValues,
  });

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      let result: Result<T>;
      try {
        result = await action(values);
      } catch (error) {
        // Las redirecciones de Next.js no son errores: se dejan pasar.
        if (error instanceof Error && "digest" in error && String(error.digest).startsWith("NEXT_"))
          throw error;
        toast.error("No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.");
        return;
      }
      if (result.ok) {
        const message =
          typeof successMessage === "function" ? successMessage(result.data) : successMessage;
        if (message) toast.success(message);
        onSuccess?.(result.data);
        return;
      }
      for (const [field, messages] of Object.entries(result.error.fieldErrors ?? {})) {
        if (field !== "_form") form.setError(field as Path<z.input<S>>, { message: messages[0] });
      }
      toast.error(result.error.message);
    }),
  );

  return { form, onSubmit, pending, errors: form.formState.errors };
}
