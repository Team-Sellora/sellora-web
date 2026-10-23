/**
 * How dashboard queries behave, in one place.
 *
 * - Fresh for 5 minutes (matches the snapshot TTL): moving between pages and
 *   back, or focusing the window, does not re-request.
 * - A 4xx is an answer, not an outage (403 for a role, 404 for no data):
 *   retrying it only adds load, so it is never retried.
 * - A 5xx or network error is retried once, after a pause — enough to ride
 *   out a blip, not enough to pile onto a struggling service.
 */
export const DASHBOARD_STALE_MS = 5 * 60 * 1000;
export const DASHBOARD_GC_MS = 30 * 60 * 1000;
export const REFRESH_COOLDOWN_MS = 30 * 1000;

export function httpStatusOf(error: unknown): number | undefined {
  const status = (error as { status?: unknown } | null)?.status;
  return typeof status === "number" ? status : undefined;
}

export function shouldRetry(failureCount: number, error: unknown): boolean {
  const status = httpStatusOf(error);
  if (status !== undefined && status >= 400 && status < 500) {
    return false;
  }
  return failureCount < 1;
}

export const retryDelay = () => 2_000;
