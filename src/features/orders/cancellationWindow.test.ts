import { describe, expect, it } from "vitest";
import { canShopCancel, formatCountdown, secondsLeft } from "./cancellationWindow";
import type { CancellationWindow, Order } from "./types";

const openWindow: CancellationWindow = {
  canCancel: true,
  confirmedAt: "2026-09-25T04:00:00Z",
  closesAt: "2026-09-25T05:00:00Z",
  windowMinutes: 60,
  remainingSeconds: 40 * 60,
  closedSecondsAgo: null,
  reason: null,
  checkedAt: "2026-09-25T04:20:00Z",
};

const order = (window: CancellationWindow | null) => ({ cancellation: window }) as Order;

describe("cancellation window", () => {
  it("counts down from when the response arrived, not from the device clock's idea of UTC", () => {
    const received = 1_000_000;

    expect(secondsLeft(openWindow, received, received)).toBe(2400);
    expect(secondsLeft(openWindow, received, received + 65_500)).toBe(2335);
  });

  it("never goes below zero", () => {
    expect(secondsLeft(openWindow, 0, 3 * 60 * 60 * 1000)).toBe(0);
  });

  it("has no countdown when the order is not yet confirmed or cannot be cancelled", () => {
    expect(secondsLeft({ ...openWindow, remainingSeconds: null }, 0, 0)).toBeNull();
    expect(secondsLeft({ ...openWindow, canCancel: false }, 0, 0)).toBeNull();
    expect(secondsLeft(null, 0, 0)).toBeNull();
  });

  it("formats minutes and hours", () => {
    expect(formatCountdown(125)).toBe("2:05");
    expect(formatCountdown(3725)).toBe("1:02:05");
    expect(formatCountdown(0)).toBe("0:00");
  });

  it("offers cancel only to the shop owner while the server says it is open", () => {
    expect(canShopCancel("ShopOwner", order(openWindow))).toBe(true);
    expect(canShopCancel("SalesRep", order(openWindow))).toBe(false);
    expect(canShopCancel("AgencyOperator", order(openWindow))).toBe(false);
    expect(canShopCancel("ShopOwner", order({ ...openWindow, canCancel: false }))).toBe(false);
    expect(canShopCancel("ShopOwner", order(null))).toBe(false);
  });
});
