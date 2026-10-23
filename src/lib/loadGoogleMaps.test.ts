// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  loadGoogleMaps,
  onGoogleMapsAuthFailure,
  __resetGoogleMapsLoaderForTesting,
} from "./loadGoogleMaps";

describe("loadGoogleMaps loader", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    __resetGoogleMapsLoaderForTesting();
    document.head.innerHTML = "";
    delete (window as unknown as { google?: unknown }).google;
  });

  afterEach(() => {
    vi.useRealTimers();
    __resetGoogleMapsLoaderForTesting();
    document.head.innerHTML = "";
  });

  it("rejects immediately if API key is missing", async () => {
    await expect(loadGoogleMaps("")).rejects.toThrow("Google Maps API key is missing.");
  });

  it("resolves immediately if window.google.maps already exists", async () => {
    const mockMaps = {} as unknown as typeof google.maps;
    (window as unknown as { google: { maps: typeof google.maps } }).google = { maps: mockMaps };

    const result = await loadGoogleMaps("valid-key");
    expect(result).toBe(mockMaps);
    expect(document.querySelector("script")).toBeNull();
  });

  it("injects script tag once and resolves when loaded", async () => {
    const promise = loadGoogleMaps("my-test-key");
    const script = document.querySelector("script");

    expect(script).toBeTruthy();
    expect(script?.src).toContain("https://maps.googleapis.com/maps/api/js?key=my-test-key");

    // Calling again returns the exact same promise (idempotent)
    const promise2 = loadGoogleMaps("my-test-key");
    expect(promise2).toBe(promise);

    // Mock window.google.maps appearing and trigger onload
    const mockMaps = {} as unknown as typeof google.maps;
    (window as unknown as { google: { maps: typeof google.maps } }).google = { maps: mockMaps };
    script?.onload?.(new Event("load"));

    const result = await promise;
    expect(result).toBe(mockMaps);
  });

  it("rejects when script element triggers onerror", async () => {
    const promise = loadGoogleMaps("my-test-key");
    const script = document.querySelector("script");

    script?.onerror?.(new Event("error"));

    await expect(promise).rejects.toThrow("Failed to load Google Maps script.");
  });

  it("rejects on timeout if script takes too long", async () => {
    const promise = loadGoogleMaps("my-test-key", 5000);

    vi.advanceTimersByTime(5000);

    await expect(promise).rejects.toThrow("Google Maps script loading timed out.");
  });

  it("triggers onGoogleMapsAuthFailure listener when gm_authFailure is called", async () => {
    const authFailureSpy = vi.fn();
    const unsubscribe = onGoogleMapsAuthFailure(authFailureSpy);

    const promise = loadGoogleMaps("my-test-key");

    // Invoke global gm_authFailure
    window.gm_authFailure?.();

    expect(authFailureSpy).toHaveBeenCalledTimes(1);
    await expect(promise).rejects.toThrow("gm_authFailure");

    unsubscribe();
  });
});
