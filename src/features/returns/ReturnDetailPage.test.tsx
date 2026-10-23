// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ReturnDetailPage } from "./ReturnDetailPage";
import * as hooks from "./hooks";
import * as auth from "@/auth/useSelloraAuth";
import type { SelloraRole } from "@/auth/useSelloraAuth";
import { ReturnApiError, type ReturnRequestDetail } from "./types";
import type { UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import type { DecideReturnPayload } from "./types";

vi.mock("@/routes/returns_.$returnId", () => ({
  Route: {
    useParams: () => ({ returnId: "ret-123" }),
  },
}));

vi.mock("@tanstack/react-router", () => ({
  Link: (props: { to: string; children?: React.ReactNode }) => (
    <a href={props.to}>{props.children}</a>
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

function mockAuth(role: SelloraRole) {
  vi.mocked(auth.useSelloraAuth).mockReturnValue({
    role,
    roles: [role],
    companyId: "c-1",
    accessToken: "token",
    username: "user",
    isLoading: false,
    isAuthenticated: true,
    logout: vi.fn(),
  });
}

function mockQuery(
  data: ReturnRequestDetail | undefined,
  options: { isError?: boolean; error?: unknown } = {},
) {
  vi.mocked(hooks.useReturn).mockReturnValue({
    data,
    isLoading: false,
    isError: Boolean(options.isError),
    error: options.error,
  } as unknown as UseQueryResult<ReturnRequestDetail>);
}

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
    mockAuth("ShopOwner");
    mockQuery(mockReturnDetail);

    render(<ReturnDetailPage />);

    expect(screen.getByText("Return RET-2026-0001")).toBeDefined();
    expect(screen.getByText("Sunset Grocery")).toBeDefined();
    expect(screen.getByText("Biscuits")).toBeDefined();
    expect(screen.getByText("Crushed boxes")).toBeDefined();
    expect(screen.getByText("ShopOwner")).toBeDefined();
  });

  it("only displays Approve and Reject buttons for AgencyOperator on a Requested return", () => {
    mockAuth("AgencyOperator");
    mockQuery(mockReturnDetail);

    render(<ReturnDetailPage />);

    expect(screen.getByRole("button", { name: /approve/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /reject/i })).toBeDefined();
  });

  it("hides decision buttons for other roles or when return is already decided", () => {
    mockAuth("SalesRep");
    mockQuery(mockReturnDetail);

    const { rerender } = render(<ReturnDetailPage />);
    expect(screen.queryByRole("button", { name: /approve/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /reject/i })).toBeNull();

    mockAuth("AgencyOperator");
    mockQuery({
      ...mockReturnDetail,
      status: "Approved",
      decidedByRole: "AgencyOperator",
      decidedAt: "2026-10-10T15:00:00Z",
    });

    rerender(<ReturnDetailPage />);
    expect(screen.queryByRole("button", { name: /approve/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /reject/i })).toBeNull();
    expect(screen.getByText("Decision Details")).toBeDefined();
  });

  it("shows exactly 'Stock service unavailable, try again' on 503 and does not refetch", async () => {
    mockAuth("AgencyOperator");
    mockQuery(mockReturnDetail);

    mockDecide.mockRejectedValueOnce(new ReturnApiError(503, "Inventory downstream timeout"));

    render(<ReturnDetailPage />);

    fireEvent.click(screen.getByRole("button", { name: /approve/i }));

    await waitFor(() => {
      expect(screen.getByText("Stock service unavailable, try again")).toBeDefined();
    });

    expect(screen.getByRole("button", { name: /approve/i })).toBeDefined();
    expect(mockQueryClientInvalidate).not.toHaveBeenCalled();
  });

  it("shows server detail inline and triggers refetch on 409 conflict", async () => {
    mockAuth("AgencyOperator");
    mockQuery(mockReturnDetail);

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
    mockAuth("AgencyOperator");
    mockQuery(mockReturnDetail);

    render(<ReturnDetailPage />);

    fireEvent.click(screen.getByRole("button", { name: /reject/i }));

    expect(screen.getByText("Reject Return Request")).toBeDefined();
    const rejectSubmitBtn = screen.getByRole("button", { name: /rejection|reject/i });
    expect(rejectSubmitBtn.hasAttribute("disabled")).toBe(true);

    const reasonTextarea = screen.getByLabelText(/rejection reason/i);
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
    mockAuth("AgencyOperator");
    mockQuery(undefined, {
      isError: true,
      error: new ReturnApiError(404, "Return not found"),
    });

    render(<ReturnDetailPage />);
    expect(screen.getByText("Return Request Not Found")).toBeDefined();
  });
});
