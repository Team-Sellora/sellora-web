import { afterEach, describe, expect, it, vi } from "vitest";
import { describeGeolocationError, getDevicePosition } from "./geolocation";

describe("getDevicePosition", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("asks for a fresh high-accuracy fix and reports accuracy and capture time", async () => {
    const getCurrentPosition = vi.fn(
      (success: PositionCallback, _error?: PositionErrorCallback, _options?: PositionOptions) =>
        success({
          coords: { latitude: 6.896, longitude: 79.8556, accuracy: 12 },
          timestamp: Date.UTC(2026, 8, 24, 4, 30),
        } as GeolocationPosition),
    );
    vi.stubGlobal("navigator", { geolocation: { getCurrentPosition } });
    vi.stubGlobal("window", { isSecureContext: true });

    const position = await getDevicePosition();

    expect(position).toEqual({
      latitude: 6.896,
      longitude: 79.8556,
      accuracyMeters: 12,
      capturedAt: "2026-09-24T04:30:00.000Z",
    });
    expect(getCurrentPosition.mock.calls[0]?.[2]).toMatchObject({
      enableHighAccuracy: true,
      maximumAge: 0,
    });
  });

  it("refuses on an insecure page, where browsers block GPS", async () => {
    vi.stubGlobal("window", { isSecureContext: false });

    await expect(getDevicePosition()).rejects.toThrow(/HTTPS/);
  });

  it("explains a denied permission in plain words", () => {
    expect(describeGeolocationError(1)).toMatch(/permission was denied/);
    expect(describeGeolocationError(3)).toMatch(/too long/);
  });
});
