import { expect, test, type Page } from "@playwright/test";

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, "no debe haber desplazamiento horizontal").toBeLessThanOrEqual(0);
}

test("inicio muestra los módulos y la fecha de hoy en La Paz", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Inicio" })).toBeVisible();
  await expect(page.getByText(/^Hoy, \d{2}\/\d{2}\/\d{4}$/)).toBeVisible();
  await expect(page.getByRole("link", { name: /Inventario/ }).first()).toBeVisible();
  await expectNoHorizontalScroll(page);
  await page.screenshot({
    path: `test-results/capturas/inicio-${test.info().project.name}.png`,
    fullPage: true,
  });
});

test("la navegación lleva a un módulo en preparación", async ({ page }, testInfo) => {
  await page.goto("/");
  const nav = page
    .getByRole("navigation", { name: "Navegación principal" })
    .locator("visible=true");
  await nav.getByRole("link", { name: "Ventas" }).click();
  await expect(page).toHaveURL(/\/ventas$/);
  await expect(page.getByRole("heading", { level: 1, name: "Ventas" })).toBeVisible();
  await expect(page.getByText("Módulo en preparación")).toBeVisible();
  await expect(nav.getByRole("link", { name: "Ventas" })).toHaveAttribute("aria-current", "page");
  // En escritorio la navegación es la barra lateral; en móvil y tablet, la barra inferior.
  const isSidebar = await nav.evaluate((el) => el.closest("aside") !== null);
  expect(isSidebar).toBe(testInfo.project.name === "escritorio");
});

test("en móvil la barra inferior tiene objetivos táctiles de al menos 44 px", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "movil", "solo móvil");
  await page.goto("/");
  const links = page.locator("nav.fixed a");
  await expect(links).toHaveCount(5);
  for (const box of await links.evaluateAll((els) =>
    els.map((e) => e.getBoundingClientRect().height),
  )) {
    expect(box).toBeGreaterThanOrEqual(44);
  }
  await links.filter({ hasText: "Más" }).click();
  await expect(page.getByRole("heading", { name: "Más módulos" })).toBeVisible();
  await expectNoHorizontalScroll(page);
});

test("ruta inexistente muestra 404 en español", async ({ page }) => {
  const response = await page.goto("/no-existe");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "No encontramos esta página" })).toBeVisible();
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
