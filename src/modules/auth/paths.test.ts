import { describe, expect, it } from "vitest";
import { isGuestOnlyPath, isPublicPath, safeNextPath } from "./paths";

describe("isPublicPath", () => {
  it("solo las páginas de acceso son públicas", () => {
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/auth/confirm")).toBe(true);
    expect(isPublicPath("/recuperar-contrasena")).toBe(true);
    expect(isPublicPath("/")).toBe(false);
    expect(isPublicPath("/loginx")).toBe(false);
    expect(isPublicPath("/configuracion")).toBe(false);
    expect(isPublicPath("/actualizar-contrasena")).toBe(false);
  });
  it("el catálogo de componentes es público solo si se habilita", () => {
    expect(isPublicPath("/dev/ui")).toBe(false);
    expect(isPublicPath("/dev/ui", { devUi: true })).toBe(true);
  });
  it("identifica páginas solo para visitantes", () => {
    expect(isGuestOnlyPath("/login")).toBe(true);
    expect(isGuestOnlyPath("/perfil")).toBe(false);
  });
});

describe("safeNextPath", () => {
  it("acepta rutas internas", () => {
    expect(safeNextPath("/ventas?x=1")).toBe("/ventas?x=1");
  });
  it.each(["https://malicioso.com", "//malicioso.com", "/\\malicioso.com", "", null, "/login"])(
    "rechaza %j",
    (value) => {
      expect(safeNextPath(value)).toBe("/");
    },
  );
});
