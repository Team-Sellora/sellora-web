// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ReturnDetailPage } from "./ReturnDetailPage";
import * as hooks from "./hooks";
import * as auth from "@/auth/useSelloraAuth";
import { ReturnApiError, type ReturnRequestDetail } from "./types";
import type { UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import type { DecideReturnPayload } from "./types";

vi.mock("@/routes/returns_.$returnId", () => ({
  Route: {
    useParams: () => ({ returnId: "ret-123" }),
  },
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string; params?: unknown }) => (
    <a href={to}>{children}</a>
  ),
  useParams: () => ({ returnId: "ret-123" }),
}));

vi.mock("./hooks", () => ({
  useReturn: vi.fn(),
  useDecideReturn: vi.fn(),
  returnsQueryKey: ["returns"],
}));

vi.mock("@/auth/useSelloraAuth", () => ({
  useSelloraAuth: vi.fn(),
}));

const mockQueryClientInvalidate = vi.fn();
vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: mockQueryClientInvalidate,
    }),
  };
});

const mockReturnDetail: ReturnRequestDetail = {
  returnRequestId: "ret-123",
  returnReference: "RET-2026-0001",
  deliveryJobId: "del-100",
  orderReference: "ORD-999",
  shopName: "Sunset Grocery",
  status: "Requested",
  requestedByUserId: "user-456",
  requestedByRole: "ShopOwner",
  requestedAt: "2026-10-10T14:30:00Z",
  decidedByUserId: null,
  decidedByRole: null,
  decidedAt: null,
  decisionReason: null,
  lines: [
    {
      productId: "prod-1",
      productName: "Biscuits",
      quantity: 5,
      reason: "Crushed boxes",
    },
  ],
};

describe("ReturnDetailPage", () => {
  const mockDecide = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(hooks.useDecideReturn).mockReturnValue({
      mutateAsync: mockDecide,
      isPending: false,
    } as unknown as UseMutationResult<
      ReturnRequestDetail,
      Error,
      { returnId: string; payload: DecideReturnPayload }
    >);
  });

  afterEach(() => {
    cleanup();
  });

  it("renders lines, requester role and time, and header information", () => {
    vi.mocked(auth.useSelloraAuth).mockReturnValue({
      role: "ShopOwner",
      roles: ["ShopOwner"],
      companyId: "c-1",
      accessToken: "token",
      username: "user",
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
    });

    vi.mocked(hooks.useReturn).mockReturnValue({
      data: mockReturnDetail,
      isLoading: false,
      isError: false,
    } as unknown as UseQueryResult<ReturnRequestDetail>);

    render(<ReturnDetailPage />);

    expect(screen.getByText("Return RET-2026-0001")).toBeDefined();
    expect(screen.getByText("Sunset Grocery")).toBeDefined();
    expect(screen.getByText("Biscuits")).toBeDefined();
    expect(screen.getByText("Crushed boxes")).toBeDefined();
    expect(screen.getByText("ShopOwner")).toBeDefined();
  });

  it("only displays Approve and Reject buttons for AgencyOperator on a Requested return", () => {
    vi.mocked(auth.useSelloraAuth).mockReturnValue({
      role: "AgencyOperator",
      roles: ["AgencyOperator"],
      companyId: "c-1",
      accessToken: "token",
      username: "user",
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
    });

    vi.mocked(hooks.useReturn).mockReturnValue({
      data: mockReturnDetail,
      isLoading: false,
      isError: false,
    } as unknown as UseQueryResult<ReturnRequestDetail>);

    render(<ReturnDetailPage />);

    expect(screen.getByRole("button", { name: /approve/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /reject/i })).toBeDefined();
  });

  it("hides decision buttons for other roles or when return is already decided", () => {
    // Non-operator role
    vi.mocked(auth.useSelloraAuth).mockReturnValue({
      role: "SalesRep",
      roles: ["SalesRep"],
      companyId: "c-1",
      accessToken: "token",
      username: "user",
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
    });

    vi.mocked(hooks.useReturn).mockReturnValue({
      data: mockReturnDetail,
      isLoading: false,
      isError: false,
    } as unknown as UseQueryResult<ReturnRequestDetail>);

    const { rerender } = render(<ReturnDetailPage />);
    expect(screen.queryByRole("button", { name: /approve/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /reject/i })).toBeNull();

    // Operator role but already Approved
    vi.mocked(auth.useSelloraAuth).mockReturnValue({
      role: "AgencyOperator",
      roles: ["AgencyOperator"],
      companyId: "c-1",
      accessToken: "token",
      username: "user",
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
    });

    vi.mocked(hooks.useReturn).mockReturnValue({
      data: {
        ...mockReturnDetail,
        status: "Approved",
        decidedByRole: "AgencyOperator",
        decidedAt: "2026-10-10T15:00:00Z",
      },
      isLoading: false,
      isError: false,
    } as unknown as UseQueryResult<ReturnRequestDetail>);

    rerender(<ReturnDetailPage />);
    expect(screen.queryByRole("button", { name: /approve/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /reject/i })).toBeNull();
    expect(screen.getByText("Decision Details")).toBeDefined();
  });

  it("shows exactly 'Stock service unavailable, try again' on 503 and does not refetch", async () => {
    vi.mocked(auth.useSelloraAuth).mockReturnValue({
      role: "AgencyOperator",
      roles: ["AgencyOperator"],
      companyId: "c-1",
      accessToken: "token",
      username: "user",
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
    });

    vi.mocked(hooks.useReturn).mockReturnValue({
      data: mockReturnDetail,
      isLoading: false,
      isError: false,
    } as unknown as UseQueryResult<ReturnRequestDetail>);

    mockDecide.mockRejectedValueOnce(new ReturnApiError(503, "Inventory downstream timeout"));

    render(<ReturnDetailPage />);

    fireEvent.click(screen.getByRole("button", { name: /approve/i }));

    await waitFor(() => {
      expect(screen.getByText("Stock service unavailable, try again")).toBeDefined();
    });

    // Screen state left intact: controls still available for retry, no refetch triggered
    expect(screen.getByRole("button", { name: /approve/i })).toBeDefined();
    expect(mockQueryClientInvalidate).not.toHaveBeenCalled();
  });

  it("shows server detail inline and triggers refetch on 409 conflict", async () => {
    vi.mocked(auth.useSelloraAuth).mockReturnValue({
      role: "AgencyOperator",
      roles: ["AgencyOperator"],
      companyId: "c-1",
      accessToken: "token",
      username: "user",
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
    });

    vi.mocked(hooks.useReturn).mockReturnValue({
      data: mockReturnDetail,
      isLoading: false,
      isError: false,
    } as unknown as UseQueryResult<ReturnRequestDetail>);

    mockDecide.mockRejectedValueOnce(
      new ReturnApiError(409, "Agency Alpha has no designated stock owner in Inventory."),
    );

    render(<ReturnDetailPage />);

    fireEvent.click(screen.getByRole("button", { name: /approve/i }));

    await waitFor(() => {
      expect(
        screen.getByText("Agency Alpha has no designated stock owner in Inventory."),
      ).toBeDefined();
      expect(mockQueryClientInvalidate).toHaveBeenCalledWith({
        queryKey: ["returns", "ret-123"],
      });
    });
  });

  it("opens reject dialog and requires non-blank reason before submitting rejection", async () => {
    vi.mocked(auth.useSelloraAuth).mockReturnValue({
      role: "AgencyOperator",
      roles: ["AgencyOperator"],
      companyId: "c-1",
      accessToken: "token",
      username: "user",
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
    });

    vi.mocked(hooks.useReturn).mockReturnValue({
      data: mockReturnDetail,
      isLoading: false,
      isError: false,
    } as unknown as UseQueryResult<ReturnRequestDetail>);

    render(<ReturnDetailPage />);

    fireEvent.click(screen.getByRole("button", { name: /reject/i }));

    expect(screen.getByText("Reject Return Request")).toBeDefined();
    const rejectSubmitBtn = screen.getByRole("button", { name: /reject return/i });
    expect(rejectSubmitBtn.hasAttribute("disabled")).toBe(true);

    const reasonTextarea = screen.getByPlaceholderText(/items already past return window/i);
    fireEvent.change(reasonTextarea, { target: { value: "   " } });
    expect(rejectSubmitBtn.hasAttribute("disabled")).toBe(true);

    fireEvent.change(reasonTextarea, {
      target: { value: "Goods were not received in delivery batch" },
    });
    expect(rejectSubmitBtn.hasAttribute("disabled")).toBe(false);

    fireEvent.click(rejectSubmitBtn);

    await waitFor(() => {
      expect(mockDecide).toHaveBeenCalledWith({
        returnId: "ret-123",
        payload: {
          decision: "Rejected",
          reason: "Goods were not received in delivery batch",
        },
      });
    });
  });

  it("renders 404 state when return request is not found", () => {
    vi.mocked(auth.useSelloraAuth).mockReturnValue({
      role: "AgencyOperator",
      roles: ["AgencyOperator"],
      companyId: "c-1",
      accessToken: "token",
      username: "user",
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
    });

    vi.mocked(hooks.useReturn).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new ReturnApiError(404, "Return not found"),
    } as unknown as UseQueryResult<ReturnRequestDetail>);

    render(<ReturnDetailPage />);
    expect(screen.getByText("Return Request Not Found")).toBeDefined();
  });
});
