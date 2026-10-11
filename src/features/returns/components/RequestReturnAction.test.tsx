// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RequestReturnAction } from "./RequestReturnAction";
import * as auth from "@/auth/useSelloraAuth";
import type { DeliveryDetail } from "@/features/deliveries/types";

import type { SelloraRole } from "@/auth/useSelloraAuth";

vi.mock("@/auth/useSelloraAuth", () => ({ useSelloraAuth: vi.fn() }));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children?: React.ReactNode }) => <a>{children}</a>,
}));

vi.mock("./RequestReturnDialog", () => ({
  RequestReturnDialog: ({
    isOpen,
    onSuccess,
  }: {
    isOpen: boolean;
    onSuccess: (res: {
      returnRequestId: string;
      returnReference: string;
      status: "Requested";
    }) => void;
  }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="mock-dialog">
        <button
          type="button"
          onClick={() =>
            onSuccess({
              returnRequestId: "ret-123",
              returnReference: "RET-2026-0001",
              status: "Requested",
            })
          }
        >
          Mock Submit Success
        </button>
      </div>
    );
  },
}));

const mockDelivery: DeliveryDetail = {
  id: "del-1",
  deliveryReference: "DEL-001",
  orderId: "ord-1",
  orderReference: "ORD-001",
  shopName: "Central Shop",
  territory: "North",
  status: "Delivered",
  scheduledDate: "2026-10-10",
  assignedRepName: "Alice",
  lines: [
    {
      id: "line-1",
      productId: "prod-1",
      productName: "Soap",
      quantity: 10,
      returnableQuantity: 5,
    },
  ],
  history: [],
  confirmation: null,
};

function setViewerRole(role: SelloraRole) {
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

describe("RequestReturnAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders Request return button when role is ShopOwner, status is Delivered, and returnableQuantity > 0", () => {
    setViewerRole("ShopOwner");
    render(<RequestReturnAction delivery={mockDelivery} />);
    expect(screen.getByRole("button", { name: /request return/i })).toBeDefined();
  });

  it("renders Request return button when role is SalesRep", () => {
    setViewerRole("SalesRep");
    render(<RequestReturnAction delivery={mockDelivery} />);
    expect(screen.getByRole("button", { name: /request return/i })).toBeDefined();
  });

  it("does not render when role is AgencyOperator, AreaManager, or CompanyAdmin", () => {
    for (const role of ["AgencyOperator", "AreaManager", "CompanyAdmin"] as const) {
      setViewerRole(role);
      const { container } = render(<RequestReturnAction delivery={mockDelivery} />);
      expect(container.firstChild).toBeNull();
    }
  });

  it("does not render when delivery status is not Delivered", () => {
    setViewerRole("ShopOwner");
    const pendingDelivery = { ...mockDelivery, status: "InTransit" as const };
    const { container } = render(<RequestReturnAction delivery={pendingDelivery} />);
    expect(container.firstChild).toBeNull();
  });

  it("does not render when all lines have returnableQuantity === 0", () => {
    setViewerRole("ShopOwner");
    const zeroReturnableDelivery: DeliveryDetail = {
      ...mockDelivery,
      lines: [
        {
          id: "line-1",
          productId: "prod-1",
          productName: "Soap",
          quantity: 10,
          returnableQuantity: 0,
        },
      ],
    };
    const { container } = render(<RequestReturnAction delivery={zeroReturnableDelivery} />);
    expect(container.firstChild).toBeNull();
  });

  it("opens dialog on click and displays created return reference on success", () => {
    setViewerRole("ShopOwner");
    render(<RequestReturnAction delivery={mockDelivery} />);
    fireEvent.click(screen.getByRole("button", { name: /request return/i }));

    expect(screen.getByTestId("mock-dialog")).toBeDefined();
    fireEvent.click(screen.getByText("Mock Submit Success"));

    expect(screen.getByText("Return request submitted")).toBeDefined();
    expect(screen.getByText("RET-2026-0001")).toBeDefined();
  });
});
