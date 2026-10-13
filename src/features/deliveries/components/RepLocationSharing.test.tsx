// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RepLocationSharing } from "./RepLocationSharing";
import * as api from "../api";
import * as auth from "@/auth/useSelloraAuth";
import { DeliveryApiError, type DeliveryDetail } from "../types";

vi.mock("../api", () => ({
  postDeliveryLocation: vi.fn(),
}));

vi.mock("@/auth/useSelloraAuth", () => ({
  useSelloraAuth: vi.fn(),
}));

const mockDelivery: DeliveryDetail = {
  id: "job-101",
  deliveryReference: "DEL-101",
  orderId: "ord-1",
  orderReference: "ORD-1",
  shopName: "Green Grocery",
  territory: "Colombo North",
  status: "InTransit",
  scheduledDate: "2026-10-12",
  assignedRepId: "rep-1",
  assignedRepName: "Alice Rep",
  lines: [],
  history: [],
  confirmation: null,
  version: 1,
};

describe("RepLocationSharing", () => {
  let queryClient: QueryClient;
  let watchPositionMock: ReturnType<typeof vi.fn>;
  let clearWatchMock: ReturnType<typeof vi.fn>;
  let successCallback: ((position: GeolocationPosition) => void) | null = null;
  let errorCallback: ((error: GeolocationPositionError) => void) | null = null;

  beforeEach(() => {
    vi.useFakeTimers();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    vi.clearAllMocks();

    successCallback = null;
    errorCallback = null;

    watchPositionMock = vi.fn((success, error) => {
      successCallback = success;
      errorCallback = error;
      return 42;
    });
    clearWatchMock = vi.fn();

    Object.defineProperty(globalThis.navigator, "geolocation", {
      value: {
        watchPosition: watchPositionMock,
        clearWatch: clearWatchMock,
      },
      configurable: true,
      writable: true,
    });

    Object.defineProperty(globalThis.window, "isSecureContext", {
      value: true,
      configurable: true,
      writable: true,
    });

    vi.mocked(auth.useSelloraAuth).mockReturnValue({
      role: "SalesRep",
      roles: ["SalesRep"],
      userId: "rep-1",
      username: "Alice Rep",
      companyId: "comp-1",
      accessToken: "token",
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
    });

    vi.mocked(api.postDeliveryLocation).mockResolvedValue();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  function renderComponent(delivery: DeliveryDetail = mockDelivery) {
    return render(
      <QueryClientProvider client={queryClient}>
        <RepLocationSharing delivery={delivery} />
      </QueryClientProvider>,
    );
  }

  function createFix(
    lat: number,
    lng: number,
    timestampMs: number,
    accuracy = 12,
  ): GeolocationPosition {
    return {
      coords: {
        latitude: lat,
        longitude: lng,
        accuracy,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
        toJSON: () => ({}),
      },
      timestamp: timestampMs,
      toJSON: () => ({}),
    } as unknown as GeolocationPosition;
  }

  describe("Role and status gating", () => {
    it("renders indicator and watches position when viewer is assigned rep and status is InTransit", () => {
      renderComponent();

      expect(watchPositionMock).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("status")).toBeTruthy();
      expect(screen.getByText("Sharing location")).toBeTruthy();
    });

    it("renders nothing and does not watch when viewer is not SalesRep", () => {
      vi.mocked(auth.useSelloraAuth).mockReturnValue({
        role: "ShopOwner",
        roles: ["ShopOwner"],
        userId: "shop-1",
        username: "Shop Owner",
        companyId: "comp-1",
        accessToken: "token",
        isLoading: false,
        isAuthenticated: true,
        logout: vi.fn(),
      });

      renderComponent();

      expect(watchPositionMock).not.toHaveBeenCalled();
      expect(screen.queryByText("Sharing location")).toBeNull();
    });

    it("renders nothing and does not watch when viewer is a different rep", () => {
      vi.mocked(auth.useSelloraAuth).mockReturnValue({
        role: "SalesRep",
        roles: ["SalesRep"],
        userId: "rep-999",
        username: "Bob Rep",
        companyId: "comp-1",
        accessToken: "token",
        isLoading: false,
        isAuthenticated: true,
        logout: vi.fn(),
      });

      renderComponent();

      expect(watchPositionMock).not.toHaveBeenCalled();
      expect(screen.queryByText("Sharing location")).toBeNull();
    });

    it("renders nothing when status is Assigned (not InTransit)", () => {
      renderComponent({ ...mockDelivery, status: "Assigned" });

      expect(watchPositionMock).not.toHaveBeenCalled();
      expect(screen.queryByText("Sharing location")).toBeNull();
    });

    it("renders nothing when status is Delivered", () => {
      renderComponent({ ...mockDelivery, status: "Delivered" });

      expect(watchPositionMock).not.toHaveBeenCalled();
      expect(screen.queryByText("Sharing location")).toBeNull();
    });
  });

  describe("Geolocation errors and permission", () => {
    it("shows permission-denied message when browser denies permission", async () => {
      renderComponent();

      expect(screen.getByText("Sharing location")).toBeTruthy();

      act(() => {
        if (errorCallback) {
          errorCallback({
            code: 1, // PERMISSION_DENIED
            message: "User denied Geolocation",
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          });
        }
      });

      expect(clearWatchMock).toHaveBeenCalledWith(42);
      expect(screen.queryByText("Sharing location")).toBeNull();
      expect(
        screen.getByText("Location sharing is off. Allow location access in your browser."),
      ).toBeTruthy();
    });

    it("shows off message when geolocation is unsupported", () => {
      Object.defineProperty(globalThis.navigator, "geolocation", {
        value: undefined,
        configurable: true,
        writable: true,
      });

      renderComponent();

      expect(screen.queryByText("Sharing location")).toBeNull();
      expect(
        screen.getByText("Location sharing is off. Allow location access in your browser."),
      ).toBeTruthy();
    });

    it("shows off message when in an insecure context", () => {
      Object.defineProperty(globalThis.window, "isSecureContext", {
        value: false,
        configurable: true,
        writable: true,
      });

      renderComponent();

      expect(screen.queryByText("Sharing location")).toBeNull();
      expect(
        screen.getByText("Location sharing is off. Allow location access in your browser."),
      ).toBeTruthy();
    });
  });

  describe("Position posting and throttling", () => {
    it("posts the first fix immediately with fix's own timestamp as capturedAt", async () => {
      renderComponent();

      const fixTimestamp = Date.UTC(2026, 9, 12, 10, 0, 0);
      const fix1 = createFix(6.9271, 79.8612, fixTimestamp, 15);

      await act(async () => {
        successCallback!(fix1);
      });

      expect(api.postDeliveryLocation).toHaveBeenCalledTimes(1);
      expect(api.postDeliveryLocation).toHaveBeenCalledWith("job-101", {
        latitude: 6.9271,
        longitude: 79.8612,
        accuracyMeters: 15,
        capturedAt: new Date(fixTimestamp).toISOString(),
      });
    });

    it("throttles updates to at most once per 30 seconds and posts latest fix", async () => {
      renderComponent();

      const t0 = Date.now();
      const fix1 = createFix(6.9271, 79.8612, t0);

      await act(async () => {
        successCallback!(fix1);
      });
      expect(api.postDeliveryLocation).toHaveBeenCalledTimes(1);

      // 5 seconds later, fix 2 arrives
      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000);
      });
      const t1 = t0 + 5000;
      const fix2 = createFix(6.9275, 79.8615, t1);
      await act(async () => {
        successCallback!(fix2);
      });
      // Should NOT have posted fix 2 immediately
      expect(api.postDeliveryLocation).toHaveBeenCalledTimes(1);

      // 5 seconds later (10s total), fix 3 arrives (latest fix)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000);
      });
      const t2 = t0 + 10000;
      const fix3 = createFix(6.928, 79.862, t2);
      await act(async () => {
        successCallback!(fix3);
      });
      expect(api.postDeliveryLocation).toHaveBeenCalledTimes(1);

      // Advance remaining 20s (total 30s elapsed from first post)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(20000);
      });

      // Now latest fix (fix 3) must be posted!
      expect(api.postDeliveryLocation).toHaveBeenCalledTimes(2);
      expect(api.postDeliveryLocation).toHaveBeenLastCalledWith("job-101", {
        latitude: 6.928,
        longitude: 79.862,
        accuracyMeters: 12,
        capturedAt: new Date(t2).toISOString(),
      });

      // No new fix arrives; advancing time another 30s should NOT trigger another post
      await act(async () => {
        await vi.advanceTimersByTimeAsync(30000);
      });
      expect(api.postDeliveryLocation).toHaveBeenCalledTimes(2);
    });
  });

  describe("Stop conditions and error handling", () => {
    it("stops sharing, clears watch and timers, and invalidates query on 409", async () => {
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
      vi.mocked(api.postDeliveryLocation).mockRejectedValue(
        new DeliveryApiError(409, "Delivery is no longer in transit"),
      );

      renderComponent();

      const fix = createFix(6.9271, 79.8612, Date.now());
      await act(async () => {
        successCallback!(fix);
      });

      expect(clearWatchMock).toHaveBeenCalledWith(42);
      expect(invalidateSpy).toHaveBeenCalled();
      expect(screen.queryByText("Sharing location")).toBeNull();
    });

    it("stops sharing and clears watch on 403", async () => {
      vi.mocked(api.postDeliveryLocation).mockRejectedValue(
        new DeliveryApiError(403, "Not assigned rep"),
      );

      renderComponent();

      const fix = createFix(6.9271, 79.8612, Date.now());
      await act(async () => {
        successCallback!(fix);
      });

      expect(clearWatchMock).toHaveBeenCalledWith(42);
      expect(screen.queryByText("Sharing location")).toBeNull();
    });

    it("stops sharing and clears watch on 404", async () => {
      vi.mocked(api.postDeliveryLocation).mockRejectedValue(new DeliveryApiError(404, "Not found"));

      renderComponent();

      const fix = createFix(6.9271, 79.8612, Date.now());
      await act(async () => {
        successCallback!(fix);
      });

      expect(clearWatchMock).toHaveBeenCalledWith(42);
      expect(screen.queryByText("Sharing location")).toBeNull();
    });

    it("keeps sharing on non-fatal error (500) and displays muted message until next success", async () => {
      vi.mocked(api.postDeliveryLocation).mockRejectedValueOnce(
        new DeliveryApiError(500, "Internal error"),
      );

      renderComponent();

      const t0 = Date.now();
      const fix1 = createFix(6.9271, 79.8612, t0);
      await act(async () => {
        successCallback!(fix1);
      });

      expect(screen.getByText("Sharing location")).toBeTruthy();
      expect(screen.getByText("Couldn't send last update")).toBeTruthy();
      expect(clearWatchMock).not.toHaveBeenCalled();

      // Next fix succeeds 35 seconds later
      vi.mocked(api.postDeliveryLocation).mockResolvedValueOnce();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(35000);
      });

      const fix2 = createFix(6.9279, 79.8619, t0 + 35000);
      await act(async () => {
        successCallback!(fix2);
      });

      expect(screen.getByText("Sharing location")).toBeTruthy();
      expect(screen.queryByText("Couldn't send last update")).toBeNull();
    });

    it("cleans up watch and timers on unmount", () => {
      const { unmount } = renderComponent();

      expect(watchPositionMock).toHaveBeenCalled();
      unmount();
      expect(clearWatchMock).toHaveBeenCalledWith(42);
    });
  });
});
