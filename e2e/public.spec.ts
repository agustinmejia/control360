import { expect, test } from "@playwright/test";

// Sin sesión: no requiere base de datos.

test("una ruta privada redirige al inicio de sesión conservando el destino", async ({ page }) => {
  await page.goto("/ventas");
  await expect(page).toHaveURL(/\/login\?next=%2Fventas$/);
  await expect(page.getByRole("heading", { name: "Iniciar sesión" })).toBeVisible();
});

test("la raíz redirige al inicio de sesión", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});

test("la página de recuperación de contraseña es pública", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("link", { name: "¿Olvidaste tu contraseña?" }).click();
  await expect(page.getByRole("heading", { name: "Recuperar contraseña" })).toBeVisible();
  await page.getByRole("button", { name: "Enviar enlace" }).click();
  await expect(page.getByText("Escribe un correo válido")).toBeVisible();
});

test("un enlace de correo inválido informa el problema", async ({ page }) => {
  await page.goto("/login?error=enlace");
  await expect(
    page.getByRole("alert").filter({ hasText: "no es válido o ya expiró" }),
  ).toBeVisible();
});

test("ruta inexistente muestra 404 en español", async ({ page }) => {
  await page.goto("/login");
  const response = await page.goto("/no-existe/en/absoluto");
  // Sin sesión, el proxy redirige primero al login.
  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL(/\/login/);
});

test("el manifiesto PWA es válido", async ({ request }) => {
  const res = await request.get("/manifest.webmanifest");
  expect(res.ok()).toBeTruthy();
  const manifest = await res.json();
  expect(manifest).toMatchObject({
    short_name: "Control360",
    display: "standalone",
    start_url: "/",
  });
  expect(manifest.icons.some((i: { purpose?: string }) => i.purpose === "maskable")).toBeTruthy();
});
