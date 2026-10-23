import { z } from "@/lib/validation";

const email = z.string().trim().toLowerCase().pipe(z.email("Escribe un correo válido"));

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Escribe tu contraseña"),
  next: z.string().optional(),
});
export type SignInInput = z.input<typeof signInSchema>;

export const passwordResetRequestSchema = z.object({ email });
export type PasswordResetRequestInput = z.input<typeof passwordResetRequestSchema>;

/** Misma política que Supabase Auth (config.toml): mínimo 8, letras y números. */
export const newPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Usa al menos 8 caracteres")
      .max(72, "Usa como máximo 72 caracteres")
      .regex(/[A-Za-zÁÉÍÓÚáéíóúÑñ]/, "Incluye al menos una letra")
      .regex(/\d/, "Incluye al menos un número"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Las contraseñas no coinciden",
  });
export type NewPasswordInput = z.input<typeof newPasswordSchema>;

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Escribe tu nombre").max(120, "Máximo 120 caracteres"),
  phone: z
    .string()
    .trim()
    .max(40, "Máximo 40 caracteres")
    .regex(/^[\d\s+()-]*$/, "Solo números, espacios y + ( ) -")
    .transform((v) => v || null),
});
export type ProfileInput = z.input<typeof profileSchema>;
