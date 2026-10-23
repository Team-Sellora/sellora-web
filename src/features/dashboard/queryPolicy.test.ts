import { describe, expect, it } from "vitest";
import { shouldRetry } from "./queryPolicy";

describe("dashboard retry policy", () => {
  it("never retries an answer from the server (4xx)", () => {
    for (const status of [400, 401, 403, 404, 429]) {
      expect(shouldRetry(0, { status })).toBe(false);
    }
  });

  it("retries an outage once", () => {
    expect(shouldRetry(0, { status: 503 })).toBe(true);
    expect(shouldRetry(1, { status: 503 })).toBe(false);
    expect(shouldRetry(0, new TypeError("Failed to fetch"))).toBe(true);
    expect(shouldRetry(1, new TypeError("Failed to fetch"))).toBe(false);
  });
});
