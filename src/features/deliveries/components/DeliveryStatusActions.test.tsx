// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DeliveryStatusActions } from "./DeliveryStatusActions";
import * as api from "../api";
import { DeliveryApiError } from "../types";

vi.mock("../api", () => ({
  updateDeliveryStatus: vi.fn(),
}));

import type { ComponentProps } from "react";

function renderComponent(props: ComponentProps<typeof DeliveryStatusActions>) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <DeliveryStatusActions {...props} />
    </QueryClientProvider>,
  );
}

describe("DeliveryStatusActions", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders only 'Start delivery' when status is Assigned", () => {
    renderComponent({ deliveryJobId: "job-1", currentStatus: "Assigned" });
    expect(screen.getByRole("button", { name: /start delivery/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /mark delivered/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /mark failed/i })).toBeNull();
  });

  it("renders 'Mark delivered' and 'Mark failed' when status is InTransit", () => {
    renderComponent({ deliveryJobId: "job-1", currentStatus: "InTransit" });
    expect(screen.queryByRole("button", { name: /start delivery/i })).toBeNull();
    expect(screen.getByRole("button", { name: /mark delivered/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /mark failed/i })).toBeTruthy();
  });

  it("renders no buttons for other statuses", () => {
    renderComponent({ deliveryJobId: "job-1", currentStatus: "Pending" });
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("calls updateDeliveryStatus when 'Start delivery' is clicked", async () => {
    vi.mocked(api.updateDeliveryStatus).mockResolvedValue();
    renderComponent({ deliveryJobId: "job-1", currentStatus: "Assigned" });

    fireEvent.click(screen.getByRole("button", { name: /start delivery/i }));

    await waitFor(() => {
      expect(api.updateDeliveryStatus).toHaveBeenCalledWith("job-1", { status: "InTransit" });
    });
  });

  it("handles 409 conflict and shows exact error message", async () => {
    vi.mocked(api.updateDeliveryStatus).mockRejectedValue(
      new DeliveryApiError(409, "Transition from Assigned to Delivered is not allowed"),
    );
    renderComponent({ deliveryJobId: "job-1", currentStatus: "Assigned" });

    fireEvent.click(screen.getByRole("button", { name: /start delivery/i }));

    expect(
      await screen.findByText("Transition from Assigned to Delivered is not allowed"),
    ).toBeTruthy();
  });

  it("opens Mark failed dialog and submits with reason", async () => {
    vi.mocked(api.updateDeliveryStatus).mockResolvedValue();
    renderComponent({ deliveryJobId: "job-1", currentStatus: "InTransit" });

    fireEvent.click(screen.getByRole("button", { name: /mark failed/i }));

    expect(await screen.findByText("Mark Delivery as Failed")).toBeTruthy();

    const input = screen.getByRole("textbox", { name: /reason/i });
    const submitBtn = screen.getByRole("button", { name: /submit failure/i }) as HTMLButtonElement;

    expect(submitBtn.disabled).toBe(true);

    fireEvent.change(input, { target: { value: "Vehicle broke down" } });
    
    await waitFor(() => {
      expect(submitBtn.disabled).toBe(false);
    });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.updateDeliveryStatus).toHaveBeenCalledWith("job-1", {
        status: "Failed",
        reason: "Vehicle broke down",
      });
    });
  });
});
