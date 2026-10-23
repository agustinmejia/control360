import { z } from "zod";

/**
 * Variables públicas (se incrustan en el bundle del cliente).
 * Deben leerse con `process.env.NEXT_PUBLIC_*` literal para que Next.js las sustituya.
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url({ message: "NEXT_PUBLIC_SUPABASE_URL debe ser una URL válida" }),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string({ message: "Falta NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" })
    .min(1, "Falta NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

export class EnvError extends Error {
  override name = "EnvError";
}

function parse<T>(schema: z.ZodType<T>, values: Record<string, string | undefined>): T {
  const result = schema.safeParse(values);
  if (!result.success) {
    const detail = result.error.issues.map((i) => `- ${i.message}`).join("\n");
    throw new EnvError(`Configuración de entorno inválida (ver .env.example):\n${detail}`);
  }
  return result.data;
}

export function getPublicEnv(): PublicEnv {
  return parse(publicEnvSchema, {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
  });
}

/** Indica si Supabase está configurado, sin lanzar error. */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
