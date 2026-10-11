// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DeliveryConfirmationActions } from "./DeliveryConfirmationActions";
import * as hooks from "../hooks";
import * as auth from "@/auth/useSelloraAuth";
import type { UseMutationResult } from "@tanstack/react-query";
import type { SubmitDeliveryConfirmationPayload } from "../types";

vi.mock("../hooks", () => ({
  useSubmitDeliveryConfirmation: vi.fn(),
}));

vi.mock("@/auth/useSelloraAuth", () => ({
  useSelloraAuth: vi.fn(),
}));

afterEach(cleanup);

describe("DeliveryConfirmationActions", () => {
  const mockSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth.useSelloraAuth).mockReturnValue({
      role: "ShopOwner",
      roles: ["ShopOwner"],
      companyId: "comp-1",
      accessToken: "token",
      username: "user",
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
    });
    vi.mocked(hooks.useSubmitDeliveryConfirmation).mockReturnValue({
      mutateAsync: mockSubmit,
      isPending: false,
    } as unknown as UseMutationResult<
      void,
      Error,
      { deliveryJobId: string; payload: SubmitDeliveryConfirmationPayload }
    >);
  });

  it("renders nothing for non-ShopOwner roles", () => {
    vi.mocked(auth.useSelloraAuth).mockReturnValue({
      role: "SalesRep",
      roles: ["SalesRep"],
      companyId: "comp-1",
      accessToken: "token",
      username: "user",
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
    });
    const { container } = render(
      <DeliveryConfirmationActions deliveryJobId="job-1" confirmation={{ state: "Awaiting" }} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders action buttons when state is Awaiting", () => {
    render(
      <DeliveryConfirmationActions deliveryJobId="job-1" confirmation={{ state: "Awaiting" }} />,
    );
    expect(screen.getByText("Confirm receipt")).toBeDefined();
    expect(screen.getByText("Report a problem")).toBeDefined();
  });

  it("submits confirmed outcome on Confirm receipt click", async () => {
    render(
      <DeliveryConfirmationActions deliveryJobId="job-1" confirmation={{ state: "Awaiting" }} />,
    );
    fireEvent.click(screen.getByText("Confirm receipt"));
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        deliveryJobId: "job-1",
        payload: { outcome: "Confirmed" },
      });
    });
  });

  it("renders read-only view when state is Confirmed", () => {
    render(
      <DeliveryConfirmationActions
        deliveryJobId="job-1"
        confirmation={{ state: "Confirmed", time: "2026-10-10T12:00:00Z" }}
      />,
    );
    expect(screen.getByText("Receipt confirmed")).toBeDefined();
    expect(screen.queryByText("Confirm receipt")).toBeNull();
  });

  it("renders read-only view when state is Disputed", () => {
    render(
      <DeliveryConfirmationActions
        deliveryJobId="job-1"
        confirmation={{ state: "Disputed", note: "Missing items", time: "2026-10-10T12:00:00Z" }}
      />,
    );
    expect(screen.getByText("Problem reported")).toBeDefined();
    expect(screen.getByText("Note: Missing items")).toBeDefined();
    expect(screen.queryByRole("button", { name: /report a problem/i })).toBeNull();
  });
});
