// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RequestReturnDialog } from "./RequestReturnDialog";
import * as hooks from "../hooks";
import { ReturnApiError } from "../types";
import type { UseMutationResult } from "@tanstack/react-query";
import type { CreateReturnPayload, CreateReturnResponse } from "../types";

vi.mock("../hooks", () => ({
  useCreateReturn: vi.fn(),
}));

const mockLines = [
  {
    id: "l-1",
    productId: "prod-1",
    productName: "Rice 5kg",
    quantity: 10,
    returnableQuantity: 4,
  },
  {
    id: "l-2",
    productId: "prod-2",
    productName: "Sugar 1kg",
    quantity: 20,
    returnableQuantity: 10,
  },
];

describe("RequestReturnDialog", () => {
  const mockSubmit = vi.fn();
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(hooks.useCreateReturn).mockReturnValue({
      mutateAsync: mockSubmit,
      isPending: false,
    } as unknown as UseMutationResult<CreateReturnResponse, Error, CreateReturnPayload>);
  });

  afterEach(() => {
    cleanup();
  });

  it("caps quantity input at line's returnableQuantity and prevents negative numbers", () => {
    render(
      <RequestReturnDialog
        deliveryJobId="del-123"
        lines={mockLines}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );

    const riceInput = screen.getByLabelText(/qty to return/i, {
      selector: "#qty-prod-1",
    }) as HTMLInputElement;

    // Type 99 (exceeds returnableQuantity of 4)
    fireEvent.change(riceInput, { target: { value: "99" } });
    expect(riceInput.value).toBe("4");

    // Type negative number
    fireEvent.change(riceInput, { target: { value: "-5" } });
    expect(riceInput.value).toBe("0");
  });

  it("keeps submit disabled until at least one line has quantity > 0 and a non-blank reason", () => {
    render(
      <RequestReturnDialog
        deliveryJobId="del-123"
        lines={mockLines}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );

    const submitBtn = screen.getByRole("button", { name: /submit return request/i });
    expect(submitBtn.hasAttribute("disabled")).toBe(true);

    const riceInput = screen.getByLabelText(/qty to return/i, { selector: "#qty-prod-1" });
    fireEvent.change(riceInput, { target: { value: "2" } });

    // Quantity > 0 now reveals the reason textarea, but reason is empty so submit is still disabled
    expect(submitBtn.hasAttribute("disabled")).toBe(true);

    const reasonTextarea = screen.getByPlaceholderText(/damaged items, expired stock/i);
    // Enter blank spaces
    fireEvent.change(reasonTextarea, { target: { value: "   " } });
    expect(submitBtn.hasAttribute("disabled")).toBe(true);

    // Enter valid reason
    fireEvent.change(reasonTextarea, { target: { value: "Damaged packaging" } });
    expect(submitBtn.hasAttribute("disabled")).toBe(false);
  });

  it("omits lines left at quantity 0 when submitting", async () => {
    mockSubmit.mockResolvedValueOnce({
      returnRequestId: "ret-1",
      returnReference: "RET-001",
      status: "Requested",
    });

    render(
      <RequestReturnDialog
        deliveryJobId="del-123"
        lines={mockLines}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );

    const riceInput = screen.getByLabelText(/qty to return/i, { selector: "#qty-prod-1" });
    fireEvent.change(riceInput, { target: { value: "3" } });

    const reasonTextarea = screen.getByPlaceholderText(/damaged items, expired stock/i);
    fireEvent.change(reasonTextarea, { target: { value: "Broken bag" } });

    const submitBtn = screen.getByRole("button", { name: /submit return request/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        deliveryJobId: "del-123",
        lines: [
          {
            productId: "prod-1",
            quantity: 3,
            reason: "Broken bag",
          },
        ],
      });
      expect(mockOnSuccess).toHaveBeenCalledWith({
        returnRequestId: "ret-1",
        returnReference: "RET-001",
        status: "Requested",
      });
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("maps lineErrors to the named product's row on 400 and keeps form open", async () => {
    mockSubmit.mockRejectedValueOnce(
      new ReturnApiError(400, "Validation failed", [
        { productId: "prod-1", message: "Only 1 unit remains returnable for this product." },
      ]),
    );

    render(
      <RequestReturnDialog
        deliveryJobId="del-123"
        lines={mockLines}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );

    const riceInput = screen.getByLabelText(/qty to return/i, { selector: "#qty-prod-1" });
    fireEvent.change(riceInput, { target: { value: "3" } });

    const reasonTextarea = screen.getByPlaceholderText(/damaged items, expired stock/i);
    fireEvent.change(reasonTextarea, { target: { value: "Excess stock" } });

    fireEvent.click(screen.getByRole("button", { name: /submit return request/i }));

    await waitFor(() => {
      expect(screen.getByText("Only 1 unit remains returnable for this product.")).toBeDefined();
    });

    // Form stays open and dialog was not closed
    expect(mockOnClose).not.toHaveBeenCalled();
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it("displays server detail in alert banner on 409 conflict", async () => {
    mockSubmit.mockRejectedValueOnce(new ReturnApiError(409, "Delivery job is not Delivered."));

    render(
      <RequestReturnDialog
        deliveryJobId="del-123"
        lines={mockLines}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );

    const riceInput = screen.getByLabelText(/qty to return/i, { selector: "#qty-prod-1" });
    fireEvent.change(riceInput, { target: { value: "2" } });
    fireEvent.change(screen.getByPlaceholderText(/damaged items, expired stock/i), {
      target: { value: "Faulty batch" },
    });

    const submitBtn = screen.getByRole("button", { name: /submit return request/i });
    expect(submitBtn.hasAttribute("disabled")).toBe(false);
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Delivery job is not Delivered.")).toBeDefined();
    });
    expect(mockOnClose).not.toHaveBeenCalled();
  });
});
