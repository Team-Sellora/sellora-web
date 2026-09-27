/**
 * A short-lived, per-tab copy of each dashboard answer in sessionStorage.
 *
 * Why: logging in, refreshing the page or coming back from another tab would
 * otherwise re-request every widget. A snapshot younger than the TTL is shown
 * immediately and counts as fresh, so no request is made at all.
 *
 * Isolation: every key includes the company ID and the user, so a snapshot
 * can never be shown to another company or another person using the same
 * browser tab, and logout removes them all. sessionStorage is per-tab and is
 * cleared when the tab closes; nothing is written to localStorage.
 */
const PREFIX = "sellora:dashboard:v1:";

export const SNAPSHOT_TTL_MS = 5 * 60 * 1000;

interface Snapshot<T> {
  savedAt: number;
  data: T;
}

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    // Storage can be disabled (privacy mode); the dashboard still works without it.
    return null;
  }
}

export function snapshotKey(companyId: string, user: string, widget: string): string {
  return `${PREFIX}${companyId}:${user}:${widget}`;
}

export function readSnapshot<T>(
  key: string,
  now: number = Date.now(),
): { data: T; savedAt: number } | undefined {
  const store = storage();
  const raw = store?.getItem(key);
  if (!raw) {
    return undefined;
  }

  try {
    const snapshot = JSON.parse(raw) as Snapshot<T>;
    if (typeof snapshot.savedAt !== "number" || now - snapshot.savedAt > SNAPSHOT_TTL_MS) {
      store?.removeItem(key);
      return undefined;
    }
    return { data: snapshot.data, savedAt: snapshot.savedAt };
  } catch {
    store?.removeItem(key);
    return undefined;
  }
}

export function writeSnapshot<T>(key: string, data: T, savedAt: number = Date.now()): void {
  try {
    storage()?.setItem(key, JSON.stringify({ savedAt, data } satisfies Snapshot<T>));
  } catch {
    // Quota exceeded: skip caching rather than fail the widget.
  }
}

/** Called on logout: removes every dashboard snapshot in this tab. */
export function clearDashboardSnapshots(): void {
  const store = storage();
  if (!store) {
    return;
  }

  const keys: string[] = [];
  for (let index = 0; index < store.length; index += 1) {
    const key = store.key(index);
    if (key?.startsWith(PREFIX)) {
      keys.push(key);
    }
  }
  keys.forEach((key) => store.removeItem(key));
}
