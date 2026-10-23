import { describe, expect, it } from "vitest";
import { documentTypeFromSlug, formatDocumentNumber } from "./labels";

describe("documentos de inventario", () => {
  it("numera con prefijo y ceros", () => {
    expect(formatDocumentNumber("transfer", 3)).toBe("TR-0003");
    expect(formatDocumentNumber("adjustment", 12345)).toBe("AJ-12345");
  });
  it("traduce el tipo desde la URL", () => {
    expect(documentTypeFromSlug("salida")).toBe("exit");
    expect(documentTypeFromSlug("anulacion")).toBeUndefined();
    expect(documentTypeFromSlug(undefined)).toBeUndefined();
  });
});
