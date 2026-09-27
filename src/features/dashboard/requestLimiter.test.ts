import { describe, expect, it } from "vitest";
import { createRequestLimiter } from "./requestLimiter";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

describe("request limiter", () => {
  it("never runs more than the cap at once and keeps FIFO order", async () => {
    const limiter = createRequestLimiter(2);
    const gates = [deferred<string>(), deferred<string>(), deferred<string>(), deferred<string>()];
    const started: number[] = [];

    const runs = gates.map((gate, index) =>
      limiter.run(() => {
        started.push(index);
        return gate.promise;
      }),
    );

    await Promise.resolve();
    expect(started).toEqual([0, 1]);
    expect(limiter.active).toBe(2);
    expect(limiter.queued).toBe(2);

    gates[1]!.resolve("b");
    await runs[1];
    await Promise.resolve();
    expect(started).toEqual([0, 1, 2]);

    gates[0]!.resolve("a");
    gates[2]!.resolve("c");
    await Promise.all([runs[0], runs[2]]);
    await Promise.resolve();
    expect(started).toEqual([0, 1, 2, 3]);

    gates[3]!.resolve("d");
    await expect(Promise.all(runs)).resolves.toEqual(["a", "b", "c", "d"]);
    expect(limiter.active).toBe(0);
  });

  it("frees the slot when a request fails", async () => {
    const limiter = createRequestLimiter(1);

    await expect(limiter.run(() => Promise.reject(new Error("503")))).rejects.toThrow("503");
    await expect(limiter.run(() => Promise.resolve(1))).resolves.toBe(1);
    expect(limiter.active).toBe(0);
  });

  it("rejects a nonsensical cap", () => {
    expect(() => createRequestLimiter(0)).toThrow();
  });
});
