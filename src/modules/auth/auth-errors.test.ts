import { describe, expect, it } from "vitest";
import { fromAuthError } from "./auth-errors";

describe("fromAuthError", () => {
  it("no revela si el usuario existe", () => {
    expect(fromAuthError({ code: "invalid_credentials" }).message).toBe(
      fromAuthError({ code: "user_not_found" }).message,
    );
  });
  it("informa una cuenta desactivada", () => {
    expect(fromAuthError({ code: "user_banned" }).code).toBe("FORBIDDEN");
  });
  it("trata errores desconocidos como inesperados", () => {
    expect(fromAuthError({ code: "x", status: 500 }).code).toBe("UNEXPECTED");
  });
});
