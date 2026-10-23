import { describe, expect, it } from "vitest";
import {
  computePreviousPeriod,
  countDays,
  getPresetRange,
  getTodayColombo,
  validateDateRange,
} from "./dateRange";

describe("dateRange presets and Colombo time calculations", () => {
  it("determines calendar day in Asia/Colombo for UTC evening that crosses the date line", () => {
    // 2026-10-14 20:00 UTC is 2026-10-15 01:30 in Asia/Colombo (+05:30)
    const utcEvening = new Date("2026-10-14T20:00:00Z");
    expect(getTodayColombo(utcEvening)).toBe("2026-10-15");
  });

  it("calculates this-month preset starting from the 1st of the current month", () => {
    const fixedNow = new Date("2026-10-14T10:00:00Z"); // 2026-10-14 in Colombo
    const range = getPresetRange("this-month", fixedNow);
    expect(range.from).toBe("2026-10-01");
    expect(range.to).toBe("2026-10-14");
  });

  it("calculates last-month preset spanning the full previous calendar month", () => {
    const fixedNow = new Date("2026-10-14T10:00:00Z"); // October
    const range = getPresetRange("last-month", fixedNow);
    expect(range.from).toBe("2026-09-01");
    expect(range.to).toBe("2026-09-30");

    // January edge case rolling back to December of previous year
    const janDate = new Date("2026-01-15T10:00:00Z");
    const janRange = getPresetRange("last-month", janDate);
    expect(janRange.from).toBe("2025-12-01");
    expect(janRange.to).toBe("2025-12-31");
  });

  it("calculates last-90-days preset spanning exactly 90 calendar days inclusive", () => {
    const fixedNow = new Date("2026-10-14T10:00:00Z");
    const range = getPresetRange("last-90-days", fixedNow);
    expect(range.to).toBe("2026-10-14");
    expect(countDays(range.from, range.to)).toBe(90);
  });

  it("computes comparison period of equal length immediately preceding from date", () => {
    // 5 days: Oct 10, 11, 12, 13, 14
    const prev = computePreviousPeriod("2026-10-10", "2026-10-14");
    expect(prev.compareTo).toBe("2026-10-09");
    expect(prev.compareFrom).toBe("2026-10-05");
    expect(countDays(prev.compareFrom, prev.compareTo)).toBe(5);

    // Single day
    const single = computePreviousPeriod("2026-10-14", "2026-10-14");
    expect(single.compareTo).toBe("2026-10-13");
    expect(single.compareFrom).toBe("2026-10-13");
  });

  it("validates from and to date order and required formats", () => {
    expect(validateDateRange("2026-10-01", "2026-10-14")).toBeNull();
    expect(validateDateRange("2026-10-14", "2026-10-14")).toBeNull();
    expect(validateDateRange("2026-10-15", "2026-10-14")).toBe(
      "Start date cannot be after end date.",
    );
    expect(validateDateRange("", "2026-10-14")).toBe("Date range is required.");
    expect(validateDateRange("bad-date", "2026-10-14")).toBe("Invalid date format.");
  });

  it("enforces the 1,100-day maximum range limit", () => {
    // Exactly 1,100 days
    expect(validateDateRange("2023-10-11", "2026-10-14")).toBeNull();
    // 1,101 days
    expect(validateDateRange("2023-10-10", "2026-10-14")).toBe(
      "Date range cannot exceed 1,100 days.",
    );
  });
});
