import { defineConfig, devices } from "@playwright/test";

const UI_TESTS = /(public|shell|dev-ui)\.spec\.ts/;
const FLOW_TESTS = /(auth|settings|inventory)\.spec\.ts/;
const desktop = devices["Desktop Chrome"];

const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    locale: "es-BO",
    timezoneId: "America/La_Paz",
    // Permite usar un Chromium ya instalado en el equipo (PW_CHROMIUM_PATH=/ruta/chrome).
    launchOptions: process.env.PW_CHROMIUM_PATH
      ? { executablePath: process.env.PW_CHROMIUM_PATH }
      : {},
  },
  projects: [
    // Interfaz en tres tamaños de pantalla.
    {
      name: "movil",
      testMatch: UI_TESTS,
      use: { ...devices["Pixel 7"], viewport: { width: 360, height: 780 } },
    },
    {
      name: "tablet",
      testMatch: UI_TESTS,
      use: { ...desktop, viewport: { width: 768, height: 1024 } },
    },
    {
      name: "escritorio",
      testMatch: UI_TESTS,
      use: { ...desktop, viewport: { width: 1280, height: 800 } },
    },
    // Flujos con base de datos (Supabase local): una sola vez, en escritorio.
    {
      name: "flujos",
      testMatch: FLOW_TESTS,
      use: { ...desktop, viewport: { width: 1280, height: 800 } },
    },
  ],
  // Sin E2E_BASE_URL se prueba la build de producción local (ejecutar `pnpm build` antes).
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `pnpm start --port ${PORT}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
});
