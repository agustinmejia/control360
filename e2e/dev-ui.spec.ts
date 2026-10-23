import { expect, test } from "@playwright/test";

test.describe("catálogo de componentes", () => {
  test("valida en el cliente y en el servidor", async ({ page }) => {
    await page.goto("/dev/ui");
    await page.getByRole("button", { name: "Validar en el servidor" }).click();
    await expect(page.getByText("Escribe al menos 2 caracteres")).toBeVisible();

    await page.getByLabel("Producto").fill("Sal mineral");
    await page.getByLabel("Precio de venta").fill("1.250,5");
    await page.getByRole("button", { name: "Validar en el servidor" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Bs 1.250,50" })).toBeVisible();
  });

  test("muestra el error de dominio devuelto por el servidor", async ({ page }) => {
    await page.goto("/dev/ui");
    await page.getByLabel("Producto").fill("error");
    await page.getByLabel("Precio de venta").fill("10");
    await page.getByRole("button", { name: "Validar en el servidor" }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: "No hay existencias suficientes." }),
    ).toBeVisible();
  });

  test("la anulación exige un motivo", async ({ page }) => {
    await page.goto("/dev/ui");
    await page.getByRole("button", { name: "Confirmar con motivo" }).click();
    const dialog = page.getByRole("dialog", { name: /Anular la venta/ });
    await expect(dialog.getByRole("button", { name: "Anular venta" })).toBeDisabled();
    await dialog.getByLabel("Motivo").fill("Precio mal digitado");
    await dialog.getByRole("button", { name: "Anular venta" }).click();
    await expect(page.getByText("Anulada. Motivo: Precio mal digitado")).toBeVisible();
  });
});
