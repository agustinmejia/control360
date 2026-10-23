import { describe, expect, it } from "vitest";
import { describeChanges, label, ACTION_LABELS } from "./labels";

describe("describeChanges", () => {
  it("muestra antes y después, sin metadatos técnicos", () => {
    expect(
      describeChanges(
        ["role", "updated_at", "is_active"],
        { role: "viewer", is_active: true },
        { role: "admin", is_active: false },
      ),
    ).toEqual([
      { field: "Rol", before: "Consulta", after: "Administrador" },
      { field: "Activo", before: "Sí", after: "No" },
    ]);
  });
  it("tolera datos ausentes", () => {
    expect(describeChanges(null, null, null)).toEqual([]);
  });
  it("traduce o devuelve la clave", () => {
    expect(label(ACTION_LABELS, "void")).toBe("Anulación");
    expect(label(ACTION_LABELS, "otra")).toBe("otra");
  });
});
