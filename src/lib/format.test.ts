import { describe, expect, it } from "vitest";
import { formatMoney, formatQty, parseDecimalInput } from "./format";

describe("formatMoney", () => {
  it("usa Bs, punto de miles y coma decimal", () => {
    expect(formatMoney(1234.5)).toBe("Bs 1.234,50");
    expect(formatMoney("1234567.891")).toBe("Bs 1.234.567,89");
    expect(formatMoney(0)).toBe("Bs 0,00");
  });
  it("muestra guion para valores vacíos o inválidos", () => {
    expect(formatMoney(null)).toBe("—");
    expect(formatMoney("abc")).toBe("—");
  });
});

describe("formatQty", () => {
  it("muestra hasta 3 decimales y la unidad", () => {
    expect(formatQty(12.5, "kg")).toBe("12,5 kg");
    expect(formatQty("1000")).toBe("1.000");
    expect(formatQty(0.1235)).toBe("0,124");
  });
});

describe("parseDecimalInput", () => {
  it.each([
    ["1234", "1234.00"],
    ["1234,5", "1234.50"],
    ["1.234,50", "1234.50"],
    ["1,234.50", "1234.50"],
    ["1234.5", "1234.50"],
    ["1.234", "1234.00"],
    ["1.234.567", "1234567.00"],
    ["0,5", "0.50"],
    [" 007 ", "7.00"],
  ])("dinero: %s → %s", (input, expected) => {
    expect(parseDecimalInput(input)).toBe(expected);
  });

  it("en cantidades con 3 decimales, un punto con 3 dígitos es decimal", () => {
    expect(parseDecimalInput("1.234", 3)).toBe("1.234");
    expect(parseDecimalInput("2,5", 3)).toBe("2.500");
  });

  it("enteros sin decimales", () => {
    expect(parseDecimalInput("15", 0)).toBe("15");
    expect(parseDecimalInput("1,5", 0)).toBeNull();
  });

  it.each(["", "abc", "1,2,3", "12,345", "1.2.3,4,5", "--1", "1e5"])("rechaza %j", (input) => {
    expect(parseDecimalInput(input)).toBeNull();
  });
});
