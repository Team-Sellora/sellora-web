import type { SelloraRole } from "@/auth/useSelloraAuth";
import type { CancellationWindow, Order } from "./types";

/**
 * US-E4-5: seconds left in the shop's cancellation window, counted down from
 * when the response arrived (`receivedAtMs`) rather than from the device's
 * idea of the server's time. Null when there is no running window.
 */
export function secondsLeft(
  window: CancellationWindow | null | undefined,
  receivedAtMs: number,
  nowMs: number,
): number | null {
  if (!window?.canCancel || window.remainingSeconds == null) {
    return null;
  }

  const elapsed = Math.max(0, Math.floor((nowMs - receivedAtMs) / 1000));
  return Math.max(0, window.remainingSeconds - elapsed);
}

/** 125 → "2:05", 3725 → "1:02:05". */
export function formatCountdown(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  const pad = (value: number) => String(value).padStart(2, "0");

  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(rest)}` : `${minutes}:${pad(rest)}`;
}

/** The cancel action is only for the shop owner, and only while the server says it is open. */
export function canShopCancel(role: SelloraRole | null, order: Order): boolean {
  return role === "ShopOwner" && order.cancellation?.canCancel === true;
}
