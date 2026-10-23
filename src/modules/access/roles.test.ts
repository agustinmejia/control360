import { describe, expect, it } from "vitest";
import { assignableRoles, can, canManageUser } from "./roles";

describe("can", () => {
  it("refleja la matriz de permisos de la base de datos", () => {
    expect(can("owner", "users.manage")).toBe(true);
    expect(can("admin", "settings.manage")).toBe(true);
    expect(can("operator", "settings.manage")).toBe(false);
    expect(can("operator", "operations.write")).toBe(true);
    expect(can("viewer", "operations.write")).toBe(false);
    expect(can("viewer", "operations.read")).toBe(true);
    expect(can(null, "operations.read")).toBe(false);
  });
});

describe("assignableRoles", () => {
  it("un administrador no asigna propietarios", () => {
    expect(assignableRoles("owner")).toContain("owner");
    expect(assignableRoles("admin")).toEqual(["admin", "operator", "viewer"]);
    expect(assignableRoles("operator")).toEqual([]);
  });
});

describe("canManageUser", () => {
  const owner = { id: "o", role: "owner" as const };
  const admin = { id: "a", role: "admin" as const };
  it("nadie se administra a sí mismo", () => {
    expect(canManageUser(owner, owner)).toBe(false);
  });
  it("un administrador no administra propietarios", () => {
    expect(canManageUser(admin, owner)).toBe(false);
    expect(canManageUser(admin, { id: "p", role: "operator" })).toBe(true);
    expect(canManageUser(owner, admin)).toBe(true);
  });
  it("un operador no administra a nadie", () => {
    expect(canManageUser({ id: "p", role: "operator" }, { id: "v", role: "viewer" })).toBe(false);
  });
});
