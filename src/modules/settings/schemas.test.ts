import { describe, expect, it } from "vitest";
import { branchActiveSchema, companySchema, inviteSchema } from "./schemas";

describe("companySchema", () => {
  it("normaliza campos opcionales vacíos a null y convierte los días", () => {
    const parsed = companySchema.parse({
      name: " Grupo Pecuario ",
      legalName: "",
      taxId: "",
      phone: "",
      address: "",
      backdateLimitDays: "31",
    });
    expect(parsed).toMatchObject({
      name: "Grupo Pecuario",
      legalName: null,
      backdateLimitDays: 31,
    });
  });
  it("rechaza más de 365 días", () => {
    expect(
      companySchema.safeParse({
        name: "GP",
        legalName: "",
        taxId: "",
        phone: "",
        address: "",
        backdateLimitDays: "400",
      }).success,
    ).toBe(false);
  });
});

describe("branchActiveSchema", () => {
  const id = "3f2b5c1e-8a4d-4c6e-9b7a-1d2e3f4a5b6c";
  it("desactivar exige motivo", () => {
    expect(branchActiveSchema.safeParse({ id, active: false }).success).toBe(false);
    expect(branchActiveSchema.safeParse({ id, active: false, reason: "Cierre" }).success).toBe(
      true,
    );
  });
  it("reactivar no exige motivo", () => {
    expect(branchActiveSchema.safeParse({ id, active: true }).success).toBe(true);
  });
});

describe("inviteSchema", () => {
  it("normaliza el correo y valida el rol", () => {
    const parsed = inviteSchema.parse({
      email: " Ana@Correo.COM ",
      fullName: "Ana",
      role: "operator",
    });
    expect(parsed.email).toBe("ana@correo.com");
    expect(parsed.branchIds).toEqual([]);
    expect(inviteSchema.safeParse({ email: "a@b.co", fullName: "Ana", role: "jefe" }).success).toBe(
      false,
    );
  });
});
