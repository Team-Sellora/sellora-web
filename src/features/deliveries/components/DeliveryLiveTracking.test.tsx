// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { format } from "date-fns";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DeliveryLiveTracking } from "./DeliveryLiveTracking";
import * as api from "../api";
import * as auth from "@/auth/useSelloraAuth";
import * as scriptLoader from "@/lib/loadGoogleMaps";
import { env } from "@/config/env";
import type { DeliveryDetail, DeliveryLocationResponse } from "../types";
import type { GoogleMap, GoogleMarker, GoogleMapsNamespace } from "@/lib/googleMapsTypes";

vi.mock("../api", () => ({
  fetchDeliveryLocation: vi.fn(),
}));

vi.mock("@/auth/useSelloraAuth", () => ({
  useSelloraAuth: vi.fn(),
}));

vi.mock("@/lib/loadGoogleMaps", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/loadGoogleMaps")>();
  return {
    ...actual,
    loadGoogleMaps: vi.fn(),
    onGoogleMapsAuthFailure: vi.fn(() => () => {}),
  };
});

const mockDelivery: DeliveryDetail = {
  id: "job-200",
  deliveryReference: "DEL-200",
  orderId: "ord-200",
  orderReference: "ORD-200",
  shopName: "Sunset Mart",
  territory: "Colombo South",
  status: "InTransit",
  scheduledDate: "2026-10-12",
  assignedRepName: "Bob Rep",
  lines: [],
  history: [],
  confirmation: null,
  version: 1,
};

const capturedTime = "2026-10-12T10:30:00.000Z";

const mockLocationData: DeliveryLocationResponse = {
  deliveryJobId: "job-200",
  status: "InTransit",
  position: {
    latitude: 6.9271,
    longitude: 79.8612,
    capturedAt: capturedTime,
  },
  shop: {
    latitude: 6.93,
    longitude: 79.87,
  },
};

describe("DeliveryLiveTracking", () => {
  let queryClient: QueryClient;
  let mockMapInstance: {
    fitBounds: ReturnType<typeof vi.fn>;
    setCenter: ReturnType<typeof vi.fn>;
    setZoom: ReturnType<typeof vi.fn>;
  };
  let mockMarkerInstance: {
    setPosition: ReturnType<typeof vi.fn>;
    setMap: ReturnType<typeof vi.fn>;
    getPosition: ReturnType<typeof vi.fn>;
  };
  let mockMapsNamespace: GoogleMapsNamespace;
  let mapConstructorSpy: ReturnType<typeof vi.fn>;
  let markerConstructorSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();

    // Default env API key present
    Object.defineProperty(env, "googleMapsApiKey", {
      value: "test-valid-api-key",
      configurable: true,
      writable: true,
    });

    // Default user is ShopOwner (viewer role)
    vi.mocked(auth.useSelloraAuth).mockReturnValue({
      role: "ShopOwner",
      roles: ["ShopOwner"],
      companyId: "comp-1",
      accessToken: "token",
      username: "shop-owner",
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
    });

    mockMapInstance = {
      fitBounds: vi.fn(),
      setCenter: vi.fn(),
      setZoom: vi.fn(),
    };

    mockMarkerInstance = {
      setPosition: vi.fn(),
      setMap: vi.fn(),
      getPosition: vi.fn(),
    };

    mapConstructorSpy = vi.fn(function () {
      return mockMapInstance as unknown as GoogleMap;
    });
    markerConstructorSpy = vi.fn(function () {
      return mockMarkerInstance as unknown as GoogleMarker;
    });

    mockMapsNamespace = {
      Map: mapConstructorSpy as unknown as GoogleMapsNamespace["Map"],
      Marker: markerConstructorSpy as unknown as GoogleMapsNamespace["Marker"],
      LatLngBounds: vi.fn(function () {
        return {
          extend: vi.fn().mockReturnThis(),
          isEmpty: vi.fn().mockReturnValue(false),
          getCenter: vi.fn().mockReturnValue({ lat: () => 6.9, lng: () => 79.8 }),
        };
      }) as unknown as GoogleMapsNamespace["LatLngBounds"],
    };

    vi.mocked(scriptLoader.loadGoogleMaps).mockResolvedValue(mockMapsNamespace);
    vi.mocked(api.fetchDeliveryLocation).mockResolvedValue(mockLocationData);
  });

  afterEach(() => {
    cleanup();
  });

  function renderComponent(delivery: DeliveryDetail = mockDelivery) {
    return render(
      <QueryClientProvider client={queryClient}>
        <DeliveryLiveTracking delivery={delivery} />
      </QueryClientProvider>,
    );
  }

  describe("Role and status gating", () => {
    it.each(["ShopOwner", "AgencyOperator", "AreaManager", "CompanyAdmin"] as const)(
      "renders live tracking section for %s when job is InTransit",
      async (role) => {
        vi.mocked(auth.useSelloraAuth).mockReturnValue({
          role,
          roles: [role],
          companyId: "comp-1",
          accessToken: "token",
          username: "user",
          isLoading: false,
          isAuthenticated: true,
          logout: vi.fn(),
        });

        renderComponent();

        expect(await screen.findByText("Live tracking")).toBeTruthy();
      },
    );

    it("renders nothing for SalesRep (assigned rep sees sharing indicator, not map)", () => {
      vi.mocked(auth.useSelloraAuth).mockReturnValue({
        role: "SalesRep",
        roles: ["SalesRep"],
        companyId: "comp-1",
        accessToken: "token",
        username: "rep-1",
        isLoading: false,
        isAuthenticated: true,
        logout: vi.fn(),
      });

      renderComponent();

      expect(screen.queryByText("Live tracking")).toBeNull();
      expect(api.fetchDeliveryLocation).not.toHaveBeenCalled();
    });

    it("renders nothing when job is Assigned (not InTransit)", () => {
      renderComponent({ ...mockDelivery, status: "Assigned" });

      expect(screen.queryByText("Live tracking")).toBeNull();
      expect(api.fetchDeliveryLocation).not.toHaveBeenCalled();
    });

    it("renders nothing when job is Delivered", () => {
      renderComponent({ ...mockDelivery, status: "Delivered" });

      expect(screen.queryByText("Live tracking")).toBeNull();
      expect(api.fetchDeliveryLocation).not.toHaveBeenCalled();
    });
  });

  describe("Map rendering, bounds, and updates", () => {
    it("creates Google Map once and adds delivery and shop markers", async () => {
      renderComponent();

      await waitFor(() => {
        expect(mapConstructorSpy).toHaveBeenCalledTimes(1);
      });

      // Markers created: 1 for delivery, 1 for shop
      expect(markerConstructorSpy).toHaveBeenCalledTimes(2);

      // Bounds fitted once
      expect(mockMapInstance.fitBounds).toHaveBeenCalledTimes(1);

      // Last update time displayed formatted like history timeline (PPp)
      const expectedTimeStr = format(new Date(capturedTime), "PPp");
      expect(screen.getByText(`Last updated: ${expectedTimeStr}`)).toBeTruthy();
    });

    it("moves delivery marker without re-creating map when location polls new data", async () => {
      const { rerender } = renderComponent();

      await waitFor(() => {
        expect(mapConstructorSpy).toHaveBeenCalledTimes(1);
      });

      // Simulate a subsequent query poll with new position coordinates
      const newCapturedTime = "2026-10-12T10:30:30.000Z";
      const updatedLocationData: DeliveryLocationResponse = {
        ...mockLocationData,
        position: {
          latitude: 6.9299,
          longitude: 79.8655,
          capturedAt: newCapturedTime,
        },
      };

      vi.mocked(api.fetchDeliveryLocation).mockResolvedValue(updatedLocationData);

      // Invalidate and trigger refetch
      queryClient.setQueryData(["deliveries", "location", "job-200"], updatedLocationData);

      rerender(
        <QueryClientProvider client={queryClient}>
          <DeliveryLiveTracking delivery={mockDelivery} />
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(mockMarkerInstance.setPosition).toHaveBeenCalledWith({
          lat: 6.9299,
          lng: 79.8655,
        });
      });

      // Map MUST NOT have been re-created!
      expect(mapConstructorSpy).toHaveBeenCalledTimes(1);
      // Bounds fitted once; not called again on update
      expect(mockMapInstance.fitBounds).toHaveBeenCalledTimes(1);

      // Shows updated timestamp
      const expectedTimeStr = format(new Date(newCapturedTime), "PPp");
      expect(screen.getByText(`Last updated: ${expectedTimeStr}`)).toBeTruthy();
    });
  });

  describe("Fallback panel scenarios", () => {
    it("renders fallback panel when API key is missing", async () => {
      Object.defineProperty(env, "googleMapsApiKey", {
        value: "",
        configurable: true,
        writable: true,
      });

      renderComponent();

      expect(await screen.findByText("Map unavailable")).toBeTruthy();
      const expectedTimeStr = format(new Date(capturedTime), "PPp");
      expect(screen.getByText(`Last updated: ${expectedTimeStr}`)).toBeTruthy();
    });

    it("renders fallback panel when script fails to load", async () => {
      vi.mocked(scriptLoader.loadGoogleMaps).mockRejectedValue(
        new Error("Network error loading script"),
      );

      renderComponent();

      expect(await screen.findByText("Map unavailable")).toBeTruthy();
    });

    it("renders fallback panel when script times out", async () => {
      vi.mocked(scriptLoader.loadGoogleMaps).mockRejectedValue(
        new Error("Google Maps script loading timed out."),
      );

      renderComponent();

      expect(await screen.findByText("Map unavailable")).toBeTruthy();
    });

    it("renders fallback panel on gm_authFailure", async () => {
      let authFailureHandler: () => void = () => {};
      vi.mocked(scriptLoader.onGoogleMapsAuthFailure).mockImplementation((handler) => {
        authFailureHandler = handler;
        return () => {};
      });

      renderComponent();

      // Trigger auth failure callback
      authFailureHandler();

      expect(await screen.findByText("Map unavailable")).toBeTruthy();
    });

    it("renders fallback panel with 'No position yet' when position is null", async () => {
      vi.mocked(api.fetchDeliveryLocation).mockResolvedValue({
        ...mockLocationData,
        position: null,
      });

      renderComponent();

      expect(await screen.findByText("Map unavailable")).toBeTruthy();
      expect(screen.getByText("No position yet")).toBeTruthy();
    });
  });

  describe("Loading, query error, and polling invalidation", () => {
    it("displays loading state while first query fetch is in flight", () => {
      vi.mocked(api.fetchDeliveryLocation).mockReturnValue(new Promise(() => {}));

      renderComponent();

      expect(screen.getByText("Loading tracking update...")).toBeTruthy();
    });

    it("displays muted error line when GET location endpoint fails", async () => {
      vi.mocked(api.fetchDeliveryLocation).mockRejectedValue(new Error("Server error"));

      renderComponent();

      expect(await screen.findByText("Couldn't load tracking update.")).toBeTruthy();
    });

    it("invalidates delivery query when status is no longer InTransit", async () => {
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
      vi.mocked(api.fetchDeliveryLocation).mockResolvedValue({
        ...mockLocationData,
        status: "Delivered",
      });

      renderComponent();

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalled();
      });
    });
  });
});
