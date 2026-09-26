// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardPage } from "./DashboardPage";
import { snapshotKey, writeSnapshot } from "./snapshotCache";

const auth = vi.hoisted(() => ({
  role: "CompanyAdmin" as string | null,
  companyId: "company-a" as string | null,
  username: "admin@acme",
}));

const calls = vi.hoisted(() => ({
  fetchHierarchyRollUp: vi.fn(),
  fetchOrders: vi.fn(),
  fetchProducts: vi.fn(),
  fetchVanReturns: vi.fn(),
  fetchStock: vi.fn(),
}));

vi.mock("@/auth/useSelloraAuth", () => ({ useSelloraAuth: () => auth }));
vi.mock("@/features/hierarchy/api", () => ({ fetchHierarchyRollUp: calls.fetchHierarchyRollUp }));
vi.mock("@/features/orders/api", () => ({ fetchOrders: calls.fetchOrders }));
vi.mock("@/features/products/api", () => ({ fetchProducts: calls.fetchProducts }));
vi.mock("@/features/van-returns/api", () => ({ fetchVanReturns: calls.fetchVanReturns }));
vi.mock("@/features/inventory/api", () => ({ fetchStock: calls.fetchStock }));
vi.mock("@/components/PageHeader", () => ({
  PageHeader: ({ title, actions }: { title: string; actions?: ReactNode }) => (
    <header>
      <h1>{title}</h1>
      {actions}
    </header>
  ),
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

const rollUp = [
  {
    provinceId: "p1",
    code: "WP",
    name: "Western",
    status: "Active",
    currentManager: { staffProfileId: "m", displayName: "Kamal Silva" },
    agencyCount: 3,
    territoryCount: 12,
    shopCount: 1200,
    unassignedTerritoryCount: 2,
    hasUnassignedTerritories: true,
  },
  {
    provinceId: "p2",
    code: "CP",
    name: "Central",
    status: "Active",
    currentManager: null,
    agencyCount: 1,
    territoryCount: 4,
    shopCount: 80,
    unassignedTerritoryCount: 0,
    hasUnassignedTerritories: false,
  },
];

const orders = {
  items: [
    {
      orderId: "o1",
      orderReference: "ORD-260926-AAAAAA",
      shopId: "s",
      salesRepId: "r",
      agencyId: "a",
      fulfilmentType: "ScheduledDelivery",
      status: "PendingApproval",
      orderDate: "2026-09-26T04:00:00Z",
      total: 2400,
      lineCount: 2,
    },
  ],
  page: 1,
  pageSize: 20,
  totalCount: 57,
};

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <DashboardPage />
    </QueryClientProvider>,
  );
}

describe("company admin dashboard", () => {
  beforeEach(() => {
    auth.role = "CompanyAdmin";
    auth.companyId = "company-a";
    calls.fetchHierarchyRollUp.mockResolvedValue(rollUp);
    calls.fetchOrders.mockResolvedValue(orders);
    calls.fetchProducts.mockResolvedValue({
      items: [],
      totalCount: 42,
      page: 1,
      pageSize: 1,
      totalPages: 42,
    });
    calls.fetchVanReturns.mockResolvedValue({ items: [], totalCount: 3, page: 1, pageSize: 1 });
    calls.fetchStock.mockResolvedValue([
      {
        stockItemId: "st1",
        productId: "p",
        ownerDisplayName: "Colombo Agency",
        availableQuantity: 2,
        reorderThreshold: 10,
      },
    ]);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    window.sessionStorage.clear();
  });

  it("shows the company's real totals, gaps and latest orders", async () => {
    renderPage();

    expect(await screen.findByText("57")).toBeTruthy(); // orders total
    expect(screen.getByText("1,280")).toBeTruthy(); // shops across provinces
    expect(screen.getByText("16")).toBeTruthy(); // territories
    expect(screen.getByText("1 province has no area manager")).toBeTruthy();
    expect(screen.getByText("2 territories are not assigned to an agency")).toBeTruthy();
    expect(screen.getByText("1 recent order is waiting for agency approval")).toBeTruthy();
    expect(screen.getByText("ORD-260926-AAAAAA")).toBeTruthy();
    // Gaps first in the province table.
    const provinces = screen
      .getAllByRole("row")
      .slice(1)
      .map((row) => row.textContent);
    expect(provinces[0]).toContain("Central");
  });

  it("loads the lower tier only after the first two requests settle", async () => {
    let finishRollUp!: (value: unknown) => void;
    calls.fetchHierarchyRollUp.mockReturnValue(new Promise((resolve) => (finishRollUp = resolve)));

    renderPage();
    await waitFor(() => expect(calls.fetchOrders).toHaveBeenCalledTimes(1));

    expect(calls.fetchProducts).not.toHaveBeenCalled();
    expect(calls.fetchStock).not.toHaveBeenCalled();

    finishRollUp(rollUp);

    // jsdom has no IntersectionObserver, so the section counts as visible.
    await waitFor(() => expect(calls.fetchStock).toHaveBeenCalledTimes(1));
    expect(calls.fetchProducts).toHaveBeenCalledTimes(1);
    expect(calls.fetchVanReturns).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("3 van returns are waiting to be counted")).toBeTruthy();
    expect(await screen.findByText("1 stock item is below the reorder threshold")).toBeTruthy();
  });

  it("makes no request when this company's snapshot is still fresh", async () => {
    const key = (widget: string) => snapshotKey("company-a", "admin@acme", widget);
    writeSnapshot(key("roll-up"), rollUp);
    writeSnapshot(key("recent-orders"), { totalCount: 57, items: orders.items });

    renderPage();

    expect(await screen.findByText("57")).toBeTruthy();
    expect(calls.fetchHierarchyRollUp).not.toHaveBeenCalled();
    expect(calls.fetchOrders).not.toHaveBeenCalled();
  });

  it("never shows another company's snapshot", async () => {
    writeSnapshot(snapshotKey("company-b", "admin@acme", "recent-orders"), {
      totalCount: 999,
      items: [],
    });

    renderPage();

    expect(await screen.findByText("57")).toBeTruthy();
    expect(screen.queryByText("999")).toBeNull();
    expect(calls.fetchOrders).toHaveBeenCalledTimes(1);
  });

  it("keeps the rest of the page when one service fails", async () => {
    calls.fetchOrders.mockRejectedValue(Object.assign(new Error("down"), { status: 503 }));

    renderPage();

    expect(await screen.findByText("1,280")).toBeTruthy();
    // An outage is retried once (after 2 s), then reported on that widget only.
    expect(
      await screen.findByText(/Orders could not be loaded/, {}, { timeout: 5000 }),
    ).toBeTruthy();
    expect(calls.fetchOrders).toHaveBeenCalledTimes(2);
  });

  it("does not retry a refusal", async () => {
    calls.fetchOrders.mockRejectedValue(Object.assign(new Error("forbidden"), { status: 403 }));

    renderPage();

    expect(await screen.findByText(/not allowed to see it/)).toBeTruthy();
    expect(calls.fetchOrders).toHaveBeenCalledTimes(1);
  });

  it("sends no dashboard requests for other roles", async () => {
    auth.role = "SalesRep";

    renderPage();

    expect(await screen.findByText("Welcome")).toBeTruthy();
    expect(calls.fetchHierarchyRollUp).not.toHaveBeenCalled();
    expect(calls.fetchOrders).not.toHaveBeenCalled();
  });
});
