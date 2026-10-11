// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DeliveryQueuePage } from "./DeliveryQueuePage";
import * as api from "./api";
import type { PaginatedDeliveries } from "./types";
import * as auth from "@/auth/useSelloraAuth";

vi.mock("@/config/env", () => ({
  env: {
    isBaseUrl: "http://localhost:3000",
    gatewayBaseUrl: "http://localhost:8080",
    catalogGatewayBaseUrl: "http://localhost:8081",
    inventoryGatewayBaseUrl: "http://localhost:8080",
    orderGatewayBaseUrl: "http://localhost:8080",
    deliveryGatewayBaseUrl: "http://localhost:8080",
    notificationGatewayBaseUrl: "http://localhost:8080",
    oidcClientId: "test-client-id",
    appOrigin: "http://localhost:3000",
  },
}));

vi.mock("@/auth/useSelloraAuth", () => ({
  useSelloraAuth: vi.fn(() => ({ role: "CompanyAdmin" })),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string; params?: unknown }) => (
    <a href={to}>{children}</a>
  ),
  useParams: () => ({}),
}));

const mockDeliveries: PaginatedDeliveries = {
  items: [
    {
      id: "del-1",
      deliveryReference: "DEL-001",
      orderId: "ord-1",
      orderReference: "ORD-001",
      shopName: "Test Shop",
      territory: "Test Territory",
      status: "Pending",
      scheduledDate: "2023-10-01",
      assignedRepName: null,
    },
  ],
  page: 1,
  pageSize: 20,
  totalCount: 1,
};

describe("DeliveryQueuePage", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const renderPage = (role: auth.SelloraRole = "CompanyAdmin") => {
    vi.mocked(auth.useSelloraAuth).mockReturnValue({
      role,
      roles: [role],
      companyId: "comp-1",
      accessToken: "test-token",
      username: "test-user",
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <DeliveryQueuePage />
      </QueryClientProvider>,
    );
  };

  it("fetches and renders deliveries", async () => {
    const getSpy = vi.spyOn(api, "getDeliveries").mockResolvedValue(mockDeliveries);

    renderPage();

    expect(screen.getByText("Loading deliveries…")).toBeTruthy();

    await screen.findByText("DEL-001");
    expect(screen.getByText("Test Shop")).toBeTruthy();

    // Check if the getDeliveries API was called with default params
    expect(getSpy).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      status: undefined,
      scheduledDateFrom: undefined,
      scheduledDateTo: undefined,
      salesRepId: undefined,
    });
  });

  it("updates query params when filters are applied", async () => {
    const getSpy = vi.spyOn(api, "getDeliveries").mockResolvedValue(mockDeliveries);

    renderPage("CompanyAdmin");

    await screen.findByText("DEL-001");

    // Change status filter
    // Note: Radix UI Select requires a bit of work to test, but we can simulate value changes on the native elements if we could,
    // or simulate user click. Since Radix is complex, we will just find the input rep filter for simplicity.
    const repInput = screen.getByPlaceholderText("Sales Rep ID");
    fireEvent.change(repInput, { target: { value: "REP-123" } });

    expect(getSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        salesRepId: "REP-123",
      }),
    );
  });
});
