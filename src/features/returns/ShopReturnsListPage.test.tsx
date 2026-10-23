// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ShopReturnsListPage } from "./ShopReturnsListPage";
import * as hooks from "./hooks";
import type { UseQueryResult } from "@tanstack/react-query";
import type { PaginatedReturns } from "./types";

vi.mock("./hooks", () => ({
  useReturns: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string; params?: unknown }) => (
    <a href={to}>{children}</a>
  ),
  useParams: () => ({}),
}));

const mockReturnsData: PaginatedReturns = {
  items: [
    {
      id: "ret-1",
      returnRequestId: "ret-1",
      returnReference: "RET-2026-0001",
      deliveryJobId: "del-1",
      orderReference: "ORD-100",
      shopName: "City Mart",
      status: "Requested",
      requestedAt: "2026-10-10T10:00:00Z",
      requestedByRole: "ShopOwner",
      lineCount: 2,
    },
    {
      id: "ret-2",
      returnRequestId: "ret-2",
      returnReference: "RET-2026-0002",
      deliveryJobId: "del-2",
      orderReference: "ORD-200",
      shopName: "Green Grocers",
      status: "Approved",
      requestedAt: "2026-10-09T14:00:00Z",
      requestedByRole: "SalesRep",
      lineCount: 1,
    },
  ],
  page: 1,
  pageSize: 20,
  totalCount: 2,
};

describe("ShopReturnsListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders returns in DataTable with references, shop name, status badges, and requester role", () => {
    vi.mocked(hooks.useReturns).mockReturnValue({
      data: mockReturnsData,
      isLoading: false,
      isError: false,
    } as unknown as UseQueryResult<PaginatedReturns>);

    render(<ShopReturnsListPage />);

    expect(screen.getByText("RET-2026-0001")).toBeDefined();
    expect(screen.getByText("ORD-100")).toBeDefined();
    expect(screen.getByText("City Mart")).toBeDefined();
    expect(screen.getAllByText("Requested").length).toBeGreaterThan(0);
    expect(screen.getByText("ShopOwner")).toBeDefined();

    expect(screen.getByText("RET-2026-0002")).toBeDefined();
    expect(screen.getByText("ORD-200")).toBeDefined();
    expect(screen.getByText("Green Grocers")).toBeDefined();
    expect(screen.getAllByText("Approved").length).toBeGreaterThan(0);
    expect(screen.getByText("SalesRep")).toBeDefined();
  });

  it("renders loading state", () => {
    vi.mocked(hooks.useReturns).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as unknown as UseQueryResult<PaginatedReturns>);

    const { container } = render(<ShopReturnsListPage />);
    expect(container.querySelector(".animate-pulse")).toBeDefined();
  });

  it("renders empty state when no returns exist", () => {
    vi.mocked(hooks.useReturns).mockReturnValue({
      data: { items: [], page: 1, pageSize: 20, totalCount: 0 },
      isLoading: false,
      isError: false,
    } as unknown as UseQueryResult<PaginatedReturns>);

    render(<ShopReturnsListPage />);
    expect(screen.getByText("No shop returns found.")).toBeDefined();
  });

  it("renders error state when returns query fails", () => {
    vi.mocked(hooks.useReturns).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Failed to load returns from gateway"),
    } as unknown as UseQueryResult<PaginatedReturns>);

    render(<ShopReturnsListPage />);
    expect(screen.getByText("Failed to load returns from gateway")).toBeDefined();
  });

  it("filters returns by status", () => {
    vi.mocked(hooks.useReturns).mockReturnValue({
      data: mockReturnsData,
      isLoading: false,
      isError: false,
    } as unknown as UseQueryResult<PaginatedReturns>);

    render(<ShopReturnsListPage />);

    const select = screen.getByLabelText(/filter by status/i);
    fireEvent.change(select, { target: { value: "Requested" } });

    expect(hooks.useReturns).toHaveBeenCalledWith(
      expect.objectContaining({
        status: ["Requested"],
      }),
    );
  });
});
