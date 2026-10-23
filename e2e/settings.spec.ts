import { expect, test } from "@playwright/test";
import { USERS, hasSupabase, lastEmailLink, login, logout } from "./helpers";

test.skip(!hasSupabase, "requiere Supabase local (E2E_SUPABASE=1)");
test.describe.configure({ mode: "serial" });

const stamp = Date.now().toString(36);

test("el administrador edita los datos de la empresa", async ({ page }) => {
  await login(page, USERS.admin.email);
  await page.goto("/configuracion/empresa");
  await page.getByLabel("Días permitidos para registrar con fecha pasada").fill("400");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Escribe un número de días entre 0 y 365")).toBeVisible();
  await page.getByLabel("Días permitidos para registrar con fecha pasada").fill("31");
  await page.getByLabel("NIT").fill(`10${stamp.length}`);
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Datos de la empresa guardados." }),
  ).toBeVisible();
});

test("crear y desactivar una sucursal exige motivo y queda en la bitácora", async ({ page }) => {
  const name = `Sucursal ${stamp}`;
  await login(page, USERS.admin.email);
  await page.goto("/configuracion/sucursales/nueva");
  await page.getByLabel("Nombre").fill(name);
  await page.getByLabel("Ciudad").fill("Riberalta");
  await page.getByRole("button", { name: "Crear sucursal" }).click();
  await expect(page).toHaveURL(/\/configuracion\/sucursales$/);
  await page.getByRole("link", { name }).first().click();

  await page.getByRole("button", { name: "Desactivar" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("button", { name: "Desactivar" })).toBeDisabled();
  await dialog.getByLabel("Motivo").fill("Cierre de la oficina");
  await dialog.getByRole("button", { name: "Desactivar" }).click();
  await expect(page.getByText("Motivo: Cierre de la oficina")).toBeVisible();

  await page.goto("/configuracion/bitacora?criticas=1");
  const entry = page.getByRole("listitem").filter({ hasText: "Desactivación" }).first();
  await expect(entry).toContainText("Sucursal");
  await expect(entry).toContainText("Andrés Administrador");
  await expect(entry).toContainText("Cierre de la oficina");
});

test("invitar, aceptar la invitación, y desactivar al usuario", async ({ page }) => {
  const email = `nuevo-${stamp}@control360.test`;

  await login(page, USERS.owner.email);
  await page.goto("/configuracion/usuarios");
  await page.getByLabel("Nombre").fill("Nora Nueva");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Rol").selectOption("operator");
  await page.getByRole("button", { name: "Enviar invitación" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Invitación enviada por correo." }),
  ).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: email })).toContainText(
    "Invitación pendiente",
  );
  await logout(page);

  // La persona invitada abre el enlace del correo y crea su contraseña.
  const link = await lastEmailLink(email, "/auth/confirm");
  await page.goto(link);
  await expect(page.getByRole("heading", { name: "Crea tu contraseña" })).toBeVisible();
  await page.getByLabel("Nueva contraseña").fill("corta");
  await page.getByLabel("Repite la contraseña").fill("corta");
  await page.getByRole("button", { name: "Guardar contraseña" }).click();
  await expect(page.getByText("Usa al menos 8 caracteres")).toBeVisible();
  await page.getByLabel("Nueva contraseña").fill("Nueva2026clave");
  await page.getByLabel("Repite la contraseña").fill("Nueva2026clave");
  await page.getByRole("button", { name: "Guardar contraseña" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Hola, Nora" })).toBeVisible();
  await logout(page);

  // El propietario la desactiva: ya no puede ingresar.
  await login(page, USERS.owner.email);
  await page.goto("/configuracion/usuarios");
  await page.getByRole("link", { name: /Nora Nueva/ }).click();
  await page.getByRole("button", { name: "Desactivar" }).click();
  await page.getByRole("dialog").getByLabel("Motivo").fill("Prueba de baja");
  await page.getByRole("dialog").getByRole("button", { name: "Desactivar" }).click();
  await expect(page.getByText("Motivo: Prueba de baja")).toBeVisible();
  await logout(page);

  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").fill("Nueva2026clave");
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Tu cuenta está desactivada" }),
  ).toBeVisible();
});

test("un administrador no puede gestionar al propietario", async ({ page }) => {
  await login(page, USERS.admin.email);
  await page.goto("/configuracion/usuarios");
  await page.getByRole("link", { name: /Paola Propietaria/ }).click();
  await expect(
    page.getByText("Solo un propietario puede gestionar a otro propietario."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Desactivar" })).toHaveCount(0);
  await page.goto("/configuracion/usuarios");
  const roleOptions = await page.getByLabel("Rol").locator("option").allTextContents();
  expect(roleOptions).not.toContain("Propietario");
});
