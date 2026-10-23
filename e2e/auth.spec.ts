import { expect, test } from "@playwright/test";
import { USERS, hasSupabase, login, logout } from "./helpers";

test.skip(!hasSupabase, "requiere Supabase local (E2E_SUPABASE=1)");

test("credenciales incorrectas muestran un mensaje sin revelar si la cuenta existe", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(USERS.owner.email);
  await page.getByLabel("Contraseña").fill("incorrecta1");
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Correo o contraseña incorrectos." }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test("después de ingresar vuelve a la página pedida", async ({ page }) => {
  await page.goto("/cobros");
  await expect(page).toHaveURL(/next=%2Fcobros/);
  await page.getByLabel("Correo electrónico").fill(USERS.viewer.email);
  await page.getByLabel("Contraseña").fill("Control360dev");
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/cobros$/);
});

test("con sesión iniciada, /login lleva al inicio", async ({ page }) => {
  await login(page, USERS.viewer.email);
  await page.goto("/login");
  await expect(page).toHaveURL(/\/$/);
});

test("el propietario ve Configuración y puede cerrar sesión", async ({ page }) => {
  await login(page, USERS.owner.email);
  await expect(page.getByRole("heading", { level: 1, name: "Hola, Paola" })).toBeVisible();
  await page.goto("/configuracion");
  await expect(page.getByRole("heading", { level: 1, name: "Configuración" })).toBeVisible();
  await logout(page);
  await page.goto("/configuracion");
  await expect(page).toHaveURL(/\/login\?next=%2Fconfiguracion/);
});

test("el operador no accede a Configuración", async ({ page }) => {
  await login(page, USERS.operator.email);
  await page.goto("/configuracion/usuarios");
  await expect(page.getByText("No tienes permiso para ver esta sección")).toBeVisible();
});

test("cada usuario edita su nombre y teléfono en su perfil", async ({ page }) => {
  await login(page, USERS.viewer.email);
  await page.goto("/perfil");
  await expect(page.getByRole("main").getByText("Consulta", { exact: true })).toBeVisible();
  await page.getByLabel("Teléfono").fill("abc");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("Solo números, espacios y + ( ) -")).toBeVisible();
  await page.getByLabel("Teléfono").fill("+591 70000001");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Perfil actualizado." })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Teléfono")).toHaveValue("+591 70000001");
});
