import type { DatePresetKey } from "./types";

const colomboDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Colombo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function getTodayColombo(now: Date = new Date()): string {
  return colomboDateFormatter.format(now);
}

function parseUtcDate(dateStr: string): number {
  const parts = dateStr.split("-");
  const year = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const day = Number(parts[2]);
  return Date.UTC(year, month, day);
}

function formatUtcDate(epochMs: number): string {
  const d = new Date(epochMs);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function countDays(from: string, to: string): number {
  const fromMs = parseUtcDate(from);
  const toMs = parseUtcDate(to);
  return Math.round((toMs - fromMs) / 86400000) + 1;
}

export function computePreviousPeriod(
  from: string,
  to: string,
): { compareFrom: string; compareTo: string } {
  const days = countDays(from, to);
  const fromMs = parseUtcDate(from);
  const compareToMs = fromMs - 86400000;
  const compareFromMs = compareToMs - (days - 1) * 86400000;
  return {
    compareFrom: formatUtcDate(compareFromMs),
    compareTo: formatUtcDate(compareToMs),
  };
}

export function getPresetRange(
  preset: DatePresetKey,
  now: Date = new Date(),
): { from: string; to: string } {
  const todayStr = getTodayColombo(now);
  const todayParts = todayStr.split("-");
  const year = Number(todayParts[0]);
  const month = Number(todayParts[1]);

  if (preset === "this-month") {
    const from = `${year}-${String(month).padStart(2, "0")}-01`;
    return { from, to: todayStr };
  }

  if (preset === "last-month") {
    const prevYear = month === 1 ? year - 1 : year;
    const prevMonth = month === 1 ? 12 : month - 1;
    const from = `${prevYear}-${String(prevMonth).padStart(2, "0")}-01`;
    const lastDayOfMonth = new Date(Date.UTC(prevYear, prevMonth, 0)).getUTCDate();
    const to = `${prevYear}-${String(prevMonth).padStart(2, "0")}-${String(lastDayOfMonth).padStart(2, "0")}`;
    return { from, to };
  }

  if (preset === "last-90-days") {
    const todayMs = parseUtcDate(todayStr);
    const fromMs = todayMs - 89 * 86400000;
    return { from: formatUtcDate(fromMs), to: todayStr };
  }

  return { from: todayStr, to: todayStr };
}

export function validateDateRange(from: string, to: string): string | null {
  if (!from.trim() || !to.trim()) {
    return "Date range is required.";
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return "Invalid date format.";
  }
  if (from > to) {
    return "Start date cannot be after end date.";
  }
  const days = countDays(from, to);
  if (days > 1100) {
    return "Date range cannot exceed 1,100 days.";
  }
  return null;
}
