import { expect, test, type Page } from "@playwright/test";
import { USERS, hasSupabase, login } from "./helpers";

test.skip(!hasSupabase, "requiere Supabase local (E2E_SUPABASE=1)");
test.describe.configure({ mode: "serial" });

const SACO = "Alimento balanceado engorde · Saco 40 kg";
const KG = "Alimento balanceado engorde · Kilogramo";

async function chooseProduct(page: Page, label: string, index = 0) {
  const combo = page.getByRole("combobox", { name: "Producto" }).nth(index);
  await combo.click();
  await combo.fill(label.split(" · ")[1] ?? label);
  await page
    .getByRole("option", { name: new RegExp(label.replace(/[·.]/g, ".")) })
    .first()
    .click();
}

async function stockOf(page: Page, product: string, inventory = "Inventario principal") {
  await page.goto("/inventario");
  await page.locator('select[name="inventario"]').selectOption({
    label: `${inventory} · ${inventory === "Inventario principal" ? "Sucursal principal" : "Sucursal Trinidad"}`,
  });
  await page.getByRole("button", { name: "Filtrar" }).click();
  const row = page.getByRole("row").filter({ hasText: product }).first();
  return (await row.getByRole("cell").nth(1).innerText()).split("\n")[0];
}

test("el stock global muestra el desglose por inventario y el total en kg", async ({ page }) => {
  await login(page, USERS.operator.email);
  await page.goto("/inventario");
  const row = page.getByRole("row").filter({ hasText: SACO });
  await expect(row).toContainText("40 saco");
  await expect(row).toContainText("Inventario principal: 30 saco");
  await expect(row).toContainText("Tienda Trinidad: 10 saco");
  await expect(page.getByText("Totales por producto (en unidad base)")).toBeVisible();
});

test("el operador registra una salida y no puede dejar stock negativo", async ({ page }) => {
  await login(page, USERS.operator.email);
  await page.goto("/inventario/movimientos/nuevo");
  await expect(page.getByRole("link", { name: /Ajuste/ })).toHaveCount(0);
  await page.getByRole("link", { name: /^Salida/ }).click();

  await page.getByLabel("Motivo").selectOption({ label: "Merma o pérdida" });
  await chooseProduct(page, SACO);
  await expect(page.getByText("Disponible: 30 saco")).toBeVisible();
  await page.getByLabel("Cantidad").fill("999");
  await page.getByRole("button", { name: "Registrar salida" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Stock insuficiente" })).toBeVisible();

  await page.getByLabel("Cantidad").fill("2");
  await page.getByLabel("Observaciones").fill("Sacos rotos en el depósito");
  await page.getByRole("button", { name: "Registrar salida" }).click();
  await expect(page).toHaveURL(/\/inventario\/movimientos\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { level: 1, name: /Salida SA-\d{4}/ })).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: SACO })).toContainText("−2 saco");

  expect(await stockOf(page, SACO)).toBe("28 saco");
});

test("el operador anula su propia salida del día con motivo", async ({ page }) => {
  await login(page, USERS.operator.email);
  await page.goto("/inventario/movimientos?tipo=salida");
  await page
    .getByRole("link", { name: /SA-\d{4}/ })
    .first()
    .click();
  await page.getByRole("button", { name: "Anular" }).click();
  await page.getByRole("dialog").getByLabel("Motivo").fill("Se registró dos veces");
  await page.getByRole("dialog").getByRole("button", { name: "Anular" }).click();
  await expect(page.getByText("Motivo: Se registró dos veces")).toBeVisible();
  await page.getByRole("link", { name: "ver documento inverso" }).click();
  await expect(page.getByRole("heading", { level: 1, name: /Anulación AN-\d{4}/ })).toBeVisible();
  expect(await stockOf(page, SACO)).toBe("30 saco");
});

test("fraccionar un saco suma kilos y registra la merma", async ({ page }) => {
  await login(page, USERS.operator.email);
  await page.goto("/inventario/movimientos/nuevo?tipo=fraccionamiento");
  const from = page.getByRole("combobox", { name: "Presentación que se abre" });
  await from.click();
  await page
    .getByRole("option", { name: new RegExp("Saco 40 kg") })
    .first()
    .click();
  await page.getByLabel("Cantidad que se abre").fill("1");
  const to = page.getByRole("combobox", { name: "Presentación que resulta" });
  await to.click();
  await page.getByRole("option", { name: /Kilogramo/ }).click();
  await expect(page.getByText(/Como máximo 40 kg/)).toBeVisible();
  await page.getByLabel("Cantidad que resulta").fill("39,5");
  await page.getByRole("button", { name: "Registrar fraccionamiento" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: /Fraccionamiento FR-\d{4}/ }),
  ).toBeVisible();
  await expect(page.getByText("0,5 (en unidad base)")).toBeVisible();
  expect(await stockOf(page, KG)).toBe("75 kg");
});

test("traspaso entre sucursales", async ({ page }) => {
  await login(page, USERS.operator.email);
  await page.goto("/inventario/movimientos/nuevo?tipo=traspaso");
  await page
    .getByLabel("Hacia el inventario")
    .selectOption({ label: "Tienda Trinidad · Sucursal Trinidad" });
  await chooseProduct(page, SACO);
  await page.getByLabel("Cantidad").fill("3");
  await page.getByRole("button", { name: "Registrar traspaso" }).click();
  await expect(page.getByRole("heading", { level: 1, name: /Traspaso TR-\d{4}/ })).toBeVisible();
  await expect(page.getByText("Inventario principal → Tienda Trinidad").first()).toBeVisible();
  expect(await stockOf(page, SACO, "Tienda Trinidad")).toBe("13 saco");
});

test("el kardex muestra el saldo acumulado", async ({ page }) => {
  await login(page, USERS.viewer.email);
  await page.goto("/inventario");
  await page.getByRole("link", { name: "Inventario principal: 26 saco" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Kardex" })).toBeVisible();
  const last = page.getByRole("row").last();
  await expect(last).toContainText("26");
  await expect(page.getByText("Saldo final").locator("..")).toContainText("26 saco");
});

test("el administrador crea un producto con presentación, precio por inventario y ajusta por conteo", async ({
  page,
}) => {
  const name = `Melaza ${Date.now().toString(36)}`;
  await login(page, USERS.admin.email);
  await page.goto("/inventario/productos/nuevo");
  await page.getByLabel("Nombre").fill(name);
  await page
    .getByRole("combobox", { name: "Unidad base", exact: true })
    .selectOption({ label: "Litro (l)" });
  await page.getByLabel("Precio de venta (por unidad base)").fill("6,5");
  await page.getByRole("button", { name: "Crear producto" }).click();
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();

  const add = page
    .locator("form")
    .filter({ has: page.getByRole("button", { name: "Agregar presentación" }) });
  await add.getByRole("textbox", { name: "Nombre", exact: true }).fill("Turril 200 l");
  await add
    .getByRole("combobox", { name: "Unidad", exact: true })
    .selectOption({ label: "Unidad" });
  await add.getByLabel("Contiene (l)").fill("200");
  await add.getByRole("button", { name: "Agregar presentación" }).click();
  await expect(page.getByRole("heading", { level: 3, name: "Turril 200 l" })).toBeVisible();
  await expect(page.getByText("1 u = 200 l")).toBeVisible();

  // Saldo inicial y ajuste
  await page.goto("/inventario/movimientos/nuevo?tipo=inicial");
  await chooseProduct(page, `${name} · Turril 200 l`);
  await page.getByLabel("Cantidad").fill("5");
  await page.getByLabel("Costo unitario").fill("1100");
  await page.getByRole("button", { name: "Registrar saldo inicial" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: /Saldo inicial SI-\d{4}/ }),
  ).toBeVisible();

  await page.goto("/inventario/movimientos/nuevo?tipo=ajuste");
  await page.getByLabel("Motivo").selectOption({ label: "Ajuste por conteo físico" });
  await chooseProduct(page, `${name} · Turril 200 l`);
  await expect(page.getByText("Sistema: 5 u")).toBeVisible();
  await page.getByLabel("Cantidad contada").fill("4");
  await page.getByRole("button", { name: "Registrar ajuste" }).click();
  await expect(page.getByRole("heading", { level: 1, name: /Ajuste AJ-\d{4}/ })).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: "Turril" })).toContainText("−1 u");

  await page.goto("/configuracion/bitacora?criticas=1&accion=adjust");
  await expect(page.getByRole("listitem").first()).toContainText("Ajuste");
});
