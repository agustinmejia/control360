import { describe, expect, it } from "vitest";
import { matchesQuery, normalizeText } from "./text";

describe("búsqueda de texto", () => {
  it("ignora tildes y mayúsculas", () => {
    expect(normalizeText("  Vacuna ANTIAFTOSA Ñandú ")).toBe("vacuna antiaftosa nandu");
  });
  it("encuentra palabras en cualquier orden", () => {
    expect(matchesQuery("Alimento balanceado · Saco 40 kg", "saco alimento")).toBe(true);
    expect(matchesQuery("Sal mineral", "sal saco")).toBe(false);
    expect(matchesQuery("Sal mineral", "")).toBe(true);
  });
});
