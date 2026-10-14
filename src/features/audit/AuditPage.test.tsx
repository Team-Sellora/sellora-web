// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuditPage } from "./AuditPage";
import { AuditApiError } from "./apiError";
import * as hooks from "./hooks";
import * as auth from "@/auth/useSelloraAuth";
import type { AuditEntryDetail, AuditEntrySummary, PagedAuditEntries } from "./types";

vi.mock("@/auth/useSelloraAuth", () => ({
  useSelloraAuth: vi.fn(),
}));

vi.mock("./hooks", () => ({
  useAuditSearch: vi.fn(),
  useAuditEntry: vi.fn(),
  useVerifyAudit: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

describe("AuditPage component", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const renderPage = (props: React.ComponentProps<typeof AuditPage> = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <AuditPage {...props} />
      </QueryClientProvider>,
    );
  };

  const sampleEntry: AuditEntrySummary = {
    auditEntryId: "entry-101",
    chainPosition: 42,
    eventId: "evt-001",
    eventType: "OrderPlaced",
    aggregateType: "Order",
    aggregateId: "order-guid-1234",
    orderReference: "ORD-2026-001",
    actorUserId: "user-rep-5555",
    actorRole: "SalesRep",
    occurredAt: "2026-10-14T03:59:00Z",
    recordedAt: "2026-10-14T04:00:00Z",
    correlationId: "corr-7777",
    sourceTopic: "order.events",
  };

  const samplePagedData: PagedAuditEntries = {
    items: [sampleEntry],
    page: 1,
    pageSize: 20,
    totalCount: 1,
  };

  const mockAuthRole = (role: auth.SelloraRole = "CompanyAdmin") => {
    vi.mocked(auth.useSelloraAuth).mockReturnValue({
      role,
      roles: [role],
      companyId: "comp-1",
      accessToken: "token-1",
      username: role === "CompanyAdmin" ? "acme_admin" : "area_mgr",
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
    });
  };

  const setupSearchMock = (overrides: Partial<ReturnType<typeof hooks.useAuditSearch>> = {}) => {
    vi.mocked(hooks.useAuditSearch).mockReturnValue({
      isLoading: false,
      data: undefined,
      isError: false,
      error: null,
      ...overrides,
    } as unknown as ReturnType<typeof hooks.useAuditSearch>);
    vi.mocked(hooks.useAuditEntry).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof hooks.useAuditEntry>);
    vi.mocked(hooks.useVerifyAudit).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      data: undefined,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof hooks.useVerifyAudit>);
  };

  it("renders loading state while entries are fetching", () => {
    mockAuthRole();
    setupSearchMock({ isLoading: true });

    renderPage();
    expect(screen.getByText("Loading audit entries…")).toBeDefined();
    expect(screen.getByTestId("audit-immutability-notice")).toBeDefined();
  });

  it("renders audit entry rows and formatted metadata", () => {
    mockAuthRole();
    setupSearchMock({ data: samplePagedData });

    renderPage();
    expect(screen.getByText("#42")).toBeDefined();
    expect(screen.getByText("Order Placed")).toBeDefined();
    expect(screen.getByText("ORD-2026-001")).toBeDefined();
    expect(screen.getByText("(SalesRep)")).toBeDefined();
    expect(screen.getByText("1 total")).toBeDefined();
    expect(screen.getByTestId("audit-row-42")).toBeDefined();
  });

  it("renders empty state when no entries match filters", () => {
    mockAuthRole();
    setupSearchMock({ data: { items: [], page: 1, pageSize: 20, totalCount: 0 } });

    renderPage();
    expect(
      screen.getByText("No audit entries found matching the specified filters."),
    ).toBeDefined();
  });

  it("handles 403 Forbidden error state", () => {
    mockAuthRole();
    setupSearchMock({
      isError: true,
      error: new AuditApiError(403, "Forbidden", "Access denied"),
    });

    renderPage();
    expect(screen.getByTestId("audit-error-banner")).toBeDefined();
    expect(screen.getByText("You do not have permission to view the audit log.")).toBeDefined();
  });

  it("handles 503 Service Unavailable error state", () => {
    mockAuthRole();
    setupSearchMock({
      isError: true,
      error: new AuditApiError(503, "Unavailable", "Service unavailable"),
    });

    renderPage();
    expect(screen.getByTestId("audit-error-banner")).toBeDefined();
    expect(
      screen.getByText("The audit service is currently unavailable. Please try again later."),
    ).toBeDefined();
  });

  it("displays date range validation error when from > to", () => {
    mockAuthRole();
    setupSearchMock({ data: { items: [], page: 1, pageSize: 20, totalCount: 0 } });

    renderPage();

    const fromInput = screen.getByLabelText(/From Date/);
    const toInput = screen.getByLabelText(/To Date/);
    fireEvent.change(fromInput, { target: { value: "2026-10-20" } });
    fireEvent.change(toInput, { target: { value: "2026-10-10" } });

    expect(screen.getByTestId("filter-date-error")).toBeDefined();
    expect(screen.getByText("From date cannot be after To date.")).toBeDefined();
  });

  it("hides verify panel for Area Manager role while displaying entries", () => {
    mockAuthRole("AreaManager");
    setupSearchMock({ data: samplePagedData });

    renderPage();
    expect(screen.queryByTestId("audit-verify-panel")).toBeNull();
    expect(screen.getByTestId("audit-table")).toBeDefined();
    expect(screen.getByText("#42")).toBeDefined();
  });

  it("shows timeline mode hint when orderReference is provided", () => {
    mockAuthRole();
    setupSearchMock({ data: samplePagedData });

    renderPage({ searchParams: { orderReference: "ORD-999" } });
    expect(screen.getByTestId("timeline-order-hint")).toBeDefined();
    expect(screen.getByText(/Timeline mode active/)).toBeDefined();
  });

  it("opens entry drawer when row is clicked", () => {
    mockAuthRole();
    const entryDetail: AuditEntryDetail = {
      ...sampleEntry,
      schemaVersion: 1,
      provinceId: "prov-western",
      partition: 0,
      offset: 128,
      previousHash: "prev-hash-abc-1234567890abcdef",
      hash: "curr-hash-xyz-1234567890abcdef",
      payload: JSON.stringify({
        orderId: "ord-1",
        totalAmount: 15000,
        checkoutLatitude: 6.9271,
        checkoutLongitude: 79.8612,
      }),
    };

    setupSearchMock({ data: samplePagedData });

    vi.mocked(hooks.useAuditEntry).mockImplementation((id) => {
      if (id === "entry-101") {
        return {
          data: entryDetail,
          isLoading: false,
          isError: false,
          error: null,
        } as unknown as ReturnType<typeof hooks.useAuditEntry>;
      }
      return {
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
      } as unknown as ReturnType<typeof hooks.useAuditEntry>;
    });

    renderPage();
    const row = screen.getByTestId("audit-row-42");
    fireEvent.click(row);

    expect(screen.getByTestId("audit-entry-drawer")).toBeDefined();
    expect(screen.getByText("Cryptographic Chain Hashes")).toBeDefined();
    expect(screen.getByText("Sales Rep Check-In Coordinates")).toBeDefined();
    expect(screen.getByText("View on Google Maps")).toBeDefined();
  });

  it("denies access to unauthorized roles", () => {
    vi.mocked(auth.useSelloraAuth).mockReturnValue({
      role: "SalesRep",
      roles: ["SalesRep"],
      companyId: "comp-1",
      accessToken: "token-1",
      username: "salesrep_1",
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
    });

    renderPage();
    expect(screen.getByTestId("audit-unauthorized")).toBeDefined();
    expect(screen.getByText("Access Restricted")).toBeDefined();
    expect(screen.queryByTestId("audit-table")).toBeNull();
  });
});
