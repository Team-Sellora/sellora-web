// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import {
  SNAPSHOT_TTL_MS,
  clearDashboardSnapshots,
  readSnapshot,
  snapshotKey,
  writeSnapshot,
} from "./snapshotCache";

describe("dashboard snapshot cache", () => {
  afterEach(() => window.sessionStorage.clear());

  it("returns a fresh snapshot and drops an expired one", () => {
    const key = snapshotKey("company-a", "admin", "roll-up");
    writeSnapshot(key, { agencies: 3 }, 1_000);

    expect(readSnapshot(key, 1_000 + SNAPSHOT_TTL_MS)?.data).toEqual({ agencies: 3 });
    expect(readSnapshot(key, 1_001 + SNAPSHOT_TTL_MS)).toBeUndefined();
    expect(window.sessionStorage.getItem(key)).toBeNull();
  });

  it("keeps companies and users apart", () => {
    writeSnapshot(snapshotKey("company-a", "admin", "orders"), { total: 10 });

    expect(readSnapshot(snapshotKey("company-b", "admin", "orders"))).toBeUndefined();
    expect(readSnapshot(snapshotKey("company-a", "someone-else", "orders"))).toBeUndefined();
  });

  it("clears only dashboard snapshots on logout", () => {
    writeSnapshot(snapshotKey("company-a", "admin", "orders"), { total: 10 });
    window.sessionStorage.setItem("oidc.user", "keep me");

    clearDashboardSnapshots();

    expect(readSnapshot(snapshotKey("company-a", "admin", "orders"))).toBeUndefined();
    expect(window.sessionStorage.getItem("oidc.user")).toBe("keep me");
  });

  it("ignores a corrupted entry", () => {
    const key = snapshotKey("company-a", "admin", "stock");
    window.sessionStorage.setItem(key, "{not json");

    expect(readSnapshot(key)).toBeUndefined();
  });
});
