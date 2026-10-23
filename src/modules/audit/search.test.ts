import { describe, expect, it } from "vitest";
import { dateRangeToUtc, parseAuditFilters } from "./search";

describe("parseAuditFilters", () => {
  it("ignora valores inválidos en lugar de fallar", () => {
    expect(
      parseAuditFilters({ desde: "2026-13-40", criticas: "1", modulo: "DROP TABLE", antes: "-5" }),
    ).toEqual({
      desde: undefined,
      hasta: undefined,
      criticas: true,
      modulo: undefined,
      accion: undefined,
      usuario: undefined,
      antes: undefined,
    });
  });
  it("acepta filtros válidos", () => {
    const f = parseAuditFilters({
      desde: "2026-10-01",
      accion: "void",
      antes: "120",
      criticas: "",
    });
    expect(f).toMatchObject({ desde: "2026-10-01", accion: "void", antes: 120, criticas: false });
  });
});

describe("dateRangeToUtc", () => {
  it("convierte el día de La Paz a UTC incluyendo el día final completo", () => {
    expect(dateRangeToUtc("2026-10-01", "2026-10-01")).toEqual({
      from: "2026-10-01T04:00:00.000Z",
      to: "2026-10-02T04:00:00.000Z",
    });
  });
});
