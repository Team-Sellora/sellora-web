import { describe, expect, it } from "vitest";
import { formatAov, formatInteger, formatLkr, formatPercent, formatSignedPercent } from "./format";

describe("Currency formatting", () => {
  it("formats standard amounts in LKR currency with whole rupees", () => {
    const formatted = formatLkr(1250000);
    expect(formatted).toMatch(/LKR\s1,250,000/);
  });

  it("formats AOV with exactly 2 decimal places in LKR currency", () => {
    const formatted = formatAov(4500.5);
    expect(formatted).toMatch(/LKR\s4,500\.50/);
    const zeroCents = formatAov(100);
    expect(zeroCents).toMatch(/LKR\s100\.00/);
  });

  it("formats zero correctly for both whole rupees and AOV", () => {
    expect(formatLkr(0)).toMatch(/LKR\s0/);
    expect(formatAov(0)).toMatch(/LKR\s0\.00/);
  });

  it("handles very large values without overflowing or precision issues", () => {
    const formatted = formatLkr(9876543210);
    expect(formatted).toMatch(/LKR\s9,876,543,210/);
  });

  it("returns an em dash for null, undefined and NaN values", () => {
    expect(formatLkr(null)).toBe("—");
    expect(formatLkr(undefined)).toBe("—");
    expect(formatLkr(Number.NaN)).toBe("—");
    expect(formatAov(null)).toBe("—");
    expect(formatAov(undefined)).toBe("—");
    expect(formatAov(Number.NaN)).toBe("—");
  });

  it("formats integers with thousands separators and falls back to em dash", () => {
    expect(formatInteger(1234567)).toBe("1,234,567");
    expect(formatInteger(0)).toBe("0");
    expect(formatInteger(null)).toBe("—");
    expect(formatInteger(undefined)).toBe("—");
  });

  it("formats percentages with 1 decimal place and falls back to em dash", () => {
    expect(formatPercent(12.34)).toBe("12.3%");
    expect(formatSignedPercent(5.2)).toBe("+5.2%");
    expect(formatSignedPercent(-3.45)).toBe("-3.5%");
    expect(formatSignedPercent(0)).toBe("0.0%");
    expect(formatSignedPercent(null)).toBe("—");
    expect(formatSignedPercent(undefined)).toBe("—");
  });
});
