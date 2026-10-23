import { describe, expect, it } from "vitest";
import { formatDeltaAbsolute, formatDeltaPercent, getDeltaDirection } from "./delta";

describe("Comparison delta signs", () => {
  it("determines good direction for positive sales, orders, aov, and collected deltas", () => {
    expect(getDeltaDirection("salesValue", 150000)).toBe("good");
    expect(getDeltaDirection("orderCount", 5)).toBe("good");
    expect(getDeltaDirection("averageOrderValue", 200)).toBe("good");
    expect(getDeltaDirection("collected", 100000)).toBe("good");
  });

  it("determines bad direction for negative sales, orders, aov, and collected deltas", () => {
    expect(getDeltaDirection("salesValue", -50000)).toBe("bad");
    expect(getDeltaDirection("orderCount", -3)).toBe("bad");
    expect(getDeltaDirection("averageOrderValue", -150)).toBe("bad");
    expect(getDeltaDirection("collected", -30000)).toBe("bad");
  });

  it("returns neutral direction for zero deltas", () => {
    expect(getDeltaDirection("salesValue", 0)).toBe("neutral");
    expect(getDeltaDirection("orderCount", 0)).toBe("neutral");
    expect(getDeltaDirection("outstanding", 0)).toBe("neutral");
  });

  it("inverts good vs bad direction for Outstanding liability", () => {
    // Increase in outstanding means more uncollected debt -> bad
    expect(getDeltaDirection("outstanding", 75000)).toBe("bad");
    // Decrease in outstanding means debt reduced -> good
    expect(getDeltaDirection("outstanding", -25000)).toBe("good");
  });

  it("formats delta percentage correctly with sign, and returns em dash for null or NaN", () => {
    expect(formatDeltaPercent(12.5)).toBe("+12.5%");
    expect(formatDeltaPercent(-8.3)).toBe("-8.3%");
    expect(formatDeltaPercent(0)).toBe("0.0%");
    expect(formatDeltaPercent(null)).toBe("—");
    expect(formatDeltaPercent(undefined)).toBe("—");
    expect(formatDeltaPercent(Number.NaN)).toBe("—");
  });

  it("formats delta absolute value with explicit signs", () => {
    expect(formatDeltaAbsolute(50000, "currency")).toMatch(/^\+LKR\s50,000/);
    expect(formatDeltaAbsolute(-25000, "currency")).toMatch(/^-LKR\s25,000/);
    expect(formatDeltaAbsolute(0, "currency")).toMatch(/^LKR\s0/);

    expect(formatDeltaAbsolute(15, "count")).toBe("+15");
    expect(formatDeltaAbsolute(-7, "count")).toBe("-7");
    expect(formatDeltaAbsolute(0, "count")).toBe("0");

    expect(formatDeltaAbsolute(250.5, "aov")).toMatch(/^\+LKR\s250\.50/);
    expect(formatDeltaAbsolute(-100.25, "aov")).toMatch(/^-LKR\s100\.25/);
  });
});
