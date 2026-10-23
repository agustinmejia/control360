import { expect, type Page } from "@playwright/test";

/** Usuarios de supabase/seed.sql (solo desarrollo local y CI). */
export const USERS = {
  owner: { email: "propietario@control360.test", name: "Paola Propietaria" },
  admin: { email: "admin@control360.test", name: "Andrés Administrador" },
  operator: { email: "operador@control360.test", name: "Óscar Operador" },
  viewer: { email: "consulta@control360.test", name: "Carla Consulta" },
} as const;
export const SEED_PASSWORD = "Control360dev";

/** Las pruebas con base de datos necesitan Supabase local (`pnpm db:start`). */
export const hasSupabase = Boolean(process.env.E2E_SUPABASE);

export const MAILPIT_URL = process.env.E2E_MAILPIT_URL ?? "http://127.0.0.1:54324";

export async function login(page: Page, email: string, password = SEED_PASSWORD, next?: string) {
  await page.goto(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

export async function logout(page: Page) {
  await page.goto("/perfil");
  await page.getByRole("main").getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/login/);
}

/**
 * Enlace del último correo recibido por una dirección en el buzón local (Mailpit).
 * Devuelve solo ruta y parámetros: el dominio del correo es la URL del sitio configurada
 * en Supabase, que puede no coincidir con el puerto de las pruebas.
 */
export async function lastEmailLink(to: string, pathPart: string): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const res = await fetch(`${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`);
    const list = (await res.json()) as { messages?: { ID: string }[] };
    const id = list.messages?.[0]?.ID;
    if (id) {
      const message = (await (await fetch(`${MAILPIT_URL}/api/v1/message/${id}`)).json()) as {
        HTML: string;
      };
      const href = [...message.HTML.matchAll(/href="([^"]+)"/g)]
        .map((m) => m[1]!.replaceAll("&amp;", "&"))
        .find((h) => h.includes(pathPart));
      if (href) {
        const url = new URL(href);
        return url.pathname + url.search;
      }
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No llegó el correo a ${to}`);
}
