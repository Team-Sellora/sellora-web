import { formatAov, formatInteger, formatLkr } from "./format";

export type DeltaDirection = "good" | "bad" | "neutral";

export function getDeltaDirection(metricKey: string, absolute: number): DeltaDirection {
  if (absolute === 0 || Number.isNaN(absolute)) {
    return "neutral";
  }

  // Outstanding is a liability: increasing it is bad, decreasing it is good
  if (metricKey === "outstanding") {
    return absolute > 0 ? "bad" : "good";
  }

  return absolute > 0 ? "good" : "bad";
}

export function formatDeltaPercent(percent: number | null | undefined): string {
  if (percent == null || Number.isNaN(percent)) {
    return "—";
  }
  const prefix = percent > 0 ? "+" : "";
  return `${prefix}${percent.toFixed(1)}%`;
}

export function formatDeltaAbsolute(
  absolute: number,
  formatType: "currency" | "aov" | "count" = "currency",
): string {
  if (Number.isNaN(absolute)) {
    return "—";
  }

  const sign = absolute > 0 ? "+" : absolute < 0 ? "-" : "";
  const mag = Math.abs(absolute);

  if (formatType === "count") {
    return `${sign}${formatInteger(mag)}`;
  }
  if (formatType === "aov") {
    return `${sign}${formatAov(mag)}`;
  }
  return `${sign}${formatLkr(mag)}`;
}
