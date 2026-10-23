import { beforeEach, describe, expect, it, vi } from "vitest";
import { inventoryApiFetch } from "@/api/client";
import { confirmReservation, releaseReservation, reserveStock, resolveFulfilment } from "./api";

vi.mock("@/api/client", () => ({ inventoryApiFetch: vi.fn() }));

describe("inventory reservation API", () => {
  beforeEach(() => {
    vi.mocked(inventoryApiFetch).mockReset();
    vi.mocked(inventoryApiFetch).mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({}))),
    );
  });

  it("creates a reservation for an order", async () => {
    await reserveStock({
      orderReference: "ORD-101",
      inventoryOwnerId: "owner-1",
      lines: [{ productId: "product-1", batchId: null, quantity: 2 }],
    });

    expect(inventoryApiFetch).toHaveBeenCalledWith(
      "/api/stock/reservations",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("resolves an agency fulfilment source before creating an order", async () => {
    await resolveFulfilment({
      orderReference: "ORD-101",
      agencyId: "agency-1",
      lines: [{ productId: "product-1", batchId: null, quantity: 2 }],
    });

    expect(inventoryApiFetch).toHaveBeenCalledWith(
      "/api/stock/fulfilment/resolve",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("confirms and releases reservations through their lifecycle endpoints", async () => {
    await confirmReservation("reservation-1");
    await releaseReservation("reservation-1");

    expect(inventoryApiFetch).toHaveBeenNthCalledWith(
      1,
      "/api/stock/reservations/reservation-1/confirm",
      { method: "POST" },
    );
    expect(inventoryApiFetch).toHaveBeenNthCalledWith(
      2,
      "/api/stock/reservations/reservation-1/release",
      { method: "POST" },
    );
  });
});
