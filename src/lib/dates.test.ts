import { describe, expect, it } from "vitest";
import { businessToday, formatDate, formatDateTime, isIsoDate } from "./dates";

describe("businessToday", () => {
  it("usa la zona horaria de La Paz, no la del servidor", () => {
    // 03:00 UTC del 23 = 23:00 del 22 en La Paz (UTC-4)
    expect(businessToday("America/La_Paz", new Date("2026-10-23T03:00:00Z"))).toBe("2026-10-22");
    expect(businessToday("America/La_Paz", new Date("2026-10-23T04:00:00Z"))).toBe("2026-10-23");
  });
});

describe("formatDate", () => {
  it("formatea sin desplazar el día", () => {
    expect(formatDate("2026-01-01")).toBe("01/01/2026");
  });
  it("rechaza fechas inexistentes", () => {
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(formatDate("2026-02-30")).toBe("—");
  });
});

describe("formatDateTime", () => {
  it("muestra la hora local de la empresa", () => {
    expect(formatDateTime("2026-10-23T18:05:00Z")).toBe("23/10/2026 14:05");
  });
});
