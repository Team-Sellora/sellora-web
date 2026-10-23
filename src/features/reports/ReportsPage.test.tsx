// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReportsPage } from "./ReportsPage";
import { ReportsApiError } from "./apiError";
import * as hooks from "./hooks";
import type { SalesBreakdownResponse, SalesSummaryResponse } from "./types";

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

vi.mock("./hooks", () => ({
  useSalesSummary: vi.fn(),
  useSalesBreakdown: vi.fn(),
  reportsQueryKey: ["reports"],
}));

vi.mock("@/auth/useSelloraAuth", () => ({
  useSelloraAuth: vi.fn(() => ({
    role: "CompanyAdmin",
    isAuthenticated: true,
    isLoading: false,
    roles: ["CompanyAdmin"],
    companyId: "comp-1",
    accessToken: "mock-token",
    username: "admin",
    userId: "admin-1",
    logout: vi.fn(),
  })),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

type SummaryQueryResult = ReturnType<typeof hooks.useSalesSummary>;
type BreakdownQueryResult = ReturnType<typeof hooks.useSalesBreakdown>;

function mockSummary(result: Partial<SummaryQueryResult>) {
  vi.mocked(hooks.useSalesSummary).mockReturnValue(result as unknown as SummaryQueryResult);
}

function mockBreakdown(result: Partial<BreakdownQueryResult>) {
  vi.mocked(hooks.useSalesBreakdown).mockReturnValue(result as unknown as BreakdownQueryResult);
}

const mockSummaryData: SalesSummaryResponse = {
  from: "2026-10-01",
  to: "2026-10-14",
  currency: "LKR",
  totals: {
    salesValue: 1250000,
    orderCount: 42,
    averageOrderValue: 29761.9,
    expected: 1250000,
    collected: 1100000,
    outstanding: 150000,
  },
  statusBreakdown: [
    { status: "Confirmed", count: 35 },
    { status: "Cancelled", count: 7 },
  ],
  daily: [
    { date: "2026-10-01", salesValue: 600000, orderCount: 20 },
    { date: "2026-10-02", salesValue: 650000, orderCount: 22 },
  ],
  comparison: {
    from: "2026-09-17",
    to: "2026-09-30",
    totals: {
      salesValue: 1000000,
      orderCount: 35,
      averageOrderValue: 28571.43,
      expected: 1000000,
      collected: 900000,
      outstanding: 100000,
    },
    deltas: {
      salesValue: { absolute: 250000, percent: 25.0 },
      orderCount: { absolute: 7, percent: 20.0 },
      averageOrderValue: { absolute: 1190.47, percent: 4.17 },
      collected: { absolute: 200000, percent: 22.22 },
      outstanding: { absolute: 50000, percent: 50.0 },
    },
  },
};

const mockBreakdownData: SalesBreakdownResponse = {
  groupBy: "rep",
  from: "2026-10-01",
  to: "2026-10-14",
  sort: "value",
  direction: "desc",
  currency: "LKR",
  rows: [
    {
      key: "rep-1",
      name: "Kasun Silva",
      orderCount: 25,
      salesValue: 800000,
      averageOrderValue: 32000,
    },
    {
      key: "rep-2",
      name: "Nuwan Perera",
      orderCount: 17,
      salesValue: 450000,
      averageOrderValue: 26470.59,
    },
  ],
  totalOrderCount: 42,
  totalSalesValue: 1250000,
};

describe("Empty-state rendering", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const renderPage = (props: React.ComponentProps<typeof ReportsPage> = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ReportsPage {...props} />
      </QueryClientProvider>,
    );
  };

  it("renders the page empty state when there are no confirmed sales in the period", () => {
    mockSummary({
      data: {
        ...mockSummaryData,
        totals: {
          salesValue: 0,
          orderCount: 0,
          averageOrderValue: 0,
          expected: 0,
          collected: 0,
          outstanding: 0,
        },
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    mockBreakdown({
      data: {
        ...mockBreakdownData,
        rows: [],
        totalOrderCount: 0,
        totalSalesValue: 0,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByText("No confirmed sales in this period")).toBeDefined();
  });

  it("renders the breakdown table empty state when breakdown rows are empty", () => {
    mockSummary({
      data: mockSummaryData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    mockBreakdown({
      data: {
        ...mockBreakdownData,
        rows: [],
        totalOrderCount: 0,
        totalSalesValue: 0,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByText("No confirmed sales for this breakdown")).toBeDefined();
  });
});

describe("ReportsPage component", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const renderPage = (props: React.ComponentProps<typeof ReportsPage> = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ReportsPage {...props} />
      </QueryClientProvider>,
    );
  };

  it("renders summary cards from mocked data", () => {
    mockSummary({
      data: mockSummaryData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    mockBreakdown({
      data: mockBreakdownData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByText("Total Sales")).toBeDefined();
    expect(screen.getAllByText(/1,250,000/)[0]).toBeDefined();
    expect(screen.getByText("Total Orders")).toBeDefined();
    expect(screen.getAllByText("42")[0]).toBeDefined();
    expect(screen.getAllByText("Average Order Value")[0]).toBeDefined();
    expect(screen.getByText("Collected vs Expected")).toBeDefined();
  });

  it("shows comparison deltas when compare toggle is active", () => {
    mockSummary({
      data: mockSummaryData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    mockBreakdown({
      data: mockBreakdownData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    renderPage();

    const compareToggle = screen.getByRole("switch", { name: /compare previous period/i });
    fireEvent.click(compareToggle);

    expect(screen.getByText(/\+25\.0%/)).toBeDefined();
  });

  it("renders error banner with retry button on server error", () => {
    const refetchSummary = vi.fn();
    const refetchBreakdown = vi.fn();

    mockSummary({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new ReportsApiError(400, "Date range cannot exceed 1,100 days."),
      refetch: refetchSummary,
    });

    mockBreakdown({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      refetch: refetchBreakdown,
    });

    renderPage();

    expect(screen.getByText("Date range cannot exceed 1,100 days.")).toBeDefined();

    const retryBtn = screen.getByRole("button", { name: /retry/i });
    fireEvent.click(retryBtn);

    expect(refetchSummary).toHaveBeenCalledTimes(1);
    expect(refetchBreakdown).toHaveBeenCalledTimes(1);
  });

  it("renders clear 503 message when Organization service is down", () => {
    mockSummary({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new ReportsApiError(
        503,
        "Organization service is unavailable, some area names may be missing",
      ),
      refetch: vi.fn(),
    });

    mockBreakdown({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    renderPage();

    expect(
      screen.getByText("Organization service is unavailable, some area names may be missing"),
    ).toBeDefined();
  });

  it("switches breakdown tab and requests the right groupBy dimension", () => {
    mockSummary({
      data: mockSummaryData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    mockBreakdown({
      data: mockBreakdownData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    renderPage();

    const territoryTab = screen.getByRole("tab", { name: /territory/i });
    fireEvent.pointerDown(territoryTab, { button: 0, ctrlKey: false });
    fireEvent.click(territoryTab);

    expect(hooks.useSalesBreakdown).toHaveBeenCalledWith(
      expect.objectContaining({ groupBy: "territory" }),
    );
  });

  it("displays inline validation error when from date is after to date", () => {
    mockSummary({
      data: mockSummaryData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    mockBreakdown({
      data: mockBreakdownData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    renderPage();

    const fromInput = screen.getByLabelText(/from date/i);
    fireEvent.change(fromInput, { target: { value: "2026-10-20" } });

    expect(screen.getByText("Start date cannot be after end date.")).toBeDefined();
  });
});
