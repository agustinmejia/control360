import { expect, test, type Page } from "@playwright/test";
import { USERS, hasSupabase, login } from "./helpers";

test.skip(!hasSupabase, "requiere Supabase local (E2E_SUPABASE=1)");

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, "no debe haber desplazamiento horizontal").toBeLessThanOrEqual(0);
}

test.beforeEach(async ({ page }) => {
  await login(page, USERS.operator.email);
});

test("inicio saluda al usuario y muestra la fecha de La Paz", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1, name: "Hola, Óscar" })).toBeVisible();
  await expect(page.getByText(/^Hoy, \d{2}\/\d{2}\/\d{4}$/)).toBeVisible();
  await expectNoHorizontalScroll(page);
  await page.screenshot({
    path: `test-results/capturas/inicio-${test.info().project.name}.png`,
    fullPage: true,
  });
});

test("la navegación lleva a un módulo en preparación", async ({ page }, testInfo) => {
  const nav = page
    .getByRole("navigation", { name: "Navegación principal" })
    .locator("visible=true");
  await nav.getByRole("link", { name: "Ventas" }).click();
  await expect(page).toHaveURL(/\/ventas$/);
  await expect(page.getByText("Módulo en preparación")).toBeVisible();
  await expect(nav.getByRole("link", { name: "Ventas" })).toHaveAttribute("aria-current", "page");
  const isSidebar = await nav.evaluate((el) => el.closest("aside") !== null);
  expect(isSidebar).toBe(testInfo.project.name === "escritorio");
});

test("en móvil la barra inferior tiene objetivos táctiles de al menos 44 px", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "movil", "solo móvil");
  const links = page.locator("nav.fixed a");
  await expect(links).toHaveCount(5);
  for (const height of await links.evaluateAll((els) =>
    els.map((e) => e.getBoundingClientRect().height),
  )) {
    expect(height).toBeGreaterThanOrEqual(44);
  }
  await links.filter({ hasText: "Más" }).click();
  await expect(page.getByRole("heading", { name: "Más módulos" })).toBeVisible();
  await expect(page.getByRole("main").getByRole("link", { name: "Mi perfil" })).toBeVisible();
  await expect(page.getByRole("main").getByRole("link", { name: "Configuración" })).toHaveCount(0);
  await expectNoHorizontalScroll(page);
});

test("una ruta inexistente muestra 404 en español", async ({ page }) => {
  const response = await page.goto("/no-existe");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "No encontramos esta página" })).toBeVisible();
});
