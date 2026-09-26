/**
 * Caps how many dashboard requests are in flight at once. The dashboard is
 * the first page after login, so without a cap every widget would fire at
 * the same instant; with it the backend sees a short, steady queue instead
 * of a burst. Requests beyond the cap wait in FIFO order.
 */
export interface RequestLimiter {
  run<T>(task: () => Promise<T>): Promise<T>;
  /** For tests and diagnostics. */
  readonly active: number;
  readonly queued: number;
}

export function createRequestLimiter(maxConcurrent: number): RequestLimiter {
  if (!Number.isInteger(maxConcurrent) || maxConcurrent < 1) {
    throw new Error("maxConcurrent must be a positive integer.");
  }

  let active = 0;
  const waiting: Array<() => void> = [];

  const release = () => {
    active -= 1;
    waiting.shift()?.();
  };

  return {
    get active() {
      return active;
    },
    get queued() {
      return waiting.length;
    },
    async run<T>(task: () => Promise<T>): Promise<T> {
      if (active >= maxConcurrent) {
        await new Promise<void>((resolve) => waiting.push(resolve));
      }

      active += 1;
      try {
        return await task();
      } finally {
        release();
      }
    },
  };
}

/** Shared by every dashboard widget: at most two requests at a time. */
export const dashboardLimiter = createRequestLimiter(2);
