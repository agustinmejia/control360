import { describe, expect, it } from "vitest";
import { navItemsFor } from "./navigation";

describe("navItemsFor", () => {
  it("Configuración solo para propietario y administrador", () => {
    const slugs = (role: Parameters<typeof navItemsFor>[0]) => navItemsFor(role).map((i) => i.slug);
    expect(slugs("owner")).toContain("configuracion");
    expect(slugs("admin")).toContain("configuracion");
    expect(slugs("operator")).not.toContain("configuracion");
    expect(slugs("viewer")).not.toContain("configuracion");
  });
});
