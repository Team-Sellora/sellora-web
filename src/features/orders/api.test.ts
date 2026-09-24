import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch, orderApiFetch } from "@/api/client";
import {
  checkInAtShop,
  createOrder,
  fetchOrder,
  fetchOrderableShops,
  fetchOrders,
  recordCashPayment,
} from "./api";
import { OrderApiError } from "./types";

vi.mock("@/api/client", () => ({
  apiFetch: vi.fn(),
  catalogApiFetch: vi.fn(),
  orderApiFetch: vi.fn(),
}));

const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status }));

describe("orders API", () => {
  beforeEach(() => {
    vi.mocked(orderApiFetch).mockReset();
    vi.mocked(apiFetch).mockReset();
  });

  it("posts the order without any total fields", async () => {
    vi.mocked(orderApiFetch).mockImplementation(() => json({ orderId: "o-1" }));

    await createOrder({
      shopId: "s",
      fulfilmentType: "ImmediateCashSale",
      agencyId: "a",
      territoryId: "t",
      provinceId: "p",
      lines: [{ productId: "p-1", quantity: 2, productName: "Soap", unitPrice: 120 }],
    });

    const [path, options] = vi.mocked(orderApiFetch).mock.calls[0]!;
    const body = JSON.parse(String(options?.body)) as Record<string, unknown>;

    expect(path).toBe("/api/orders");
    expect(options?.method).toBe("POST");
    expect(body["fulfilmentType"]).toBe("ImmediateCashSale");
    expect(body).not.toHaveProperty("total");
    expect(body).not.toHaveProperty("subtotal");
  });

  it("requests the list with paging", async () => {
    vi.mocked(orderApiFetch).mockImplementation(() =>
      json({ items: [], page: 2, pageSize: 20, totalCount: 0 }),
    );

    await fetchOrders({ page: 2, pageSize: 20 });

    expect(orderApiFetch).toHaveBeenCalledWith("/api/orders?page=2&pageSize=20");
  });

  it("surfaces the server's problem detail on failure", async () => {
    vi.mocked(orderApiFetch).mockImplementation(() =>
      json({ title: "Order not found", detail: "No order x is visible to the caller." }, 404),
    );

    await expect(fetchOrder("x")).rejects.toMatchObject({
      status: 404,
      message: "No order x is visible to the caller.",
    });
    await expect(fetchOrder("x")).rejects.toBeInstanceOf(OrderApiError);
  });

  it("flattens the rep's hierarchy into shops with placement IDs", async () => {
    vi.mocked(apiFetch).mockImplementation(() =>
      json({
        provinces: [
          {
            provinceId: "prov-1",
            agencies: [
              {
                agencyId: "ag-1",
                name: "Colombo Agency",
                territories: [
                  {
                    territoryId: "ter-1",
                    name: "Dehiwala",
                    shops: [{ shopId: "shop-1", name: "Perera Stores", address: "12 Galle Rd" }],
                  },
                ],
              },
            ],
          },
        ],
      }),
    );

    const shops = await fetchOrderableShops();

    expect(shops).toEqual([
      expect.objectContaining({
        shopId: "shop-1",
        territoryId: "ter-1",
        agencyId: "ag-1",
        provinceId: "prov-1",
        ownerName: null,
      }),
    ]);
  });

  it("posts the check-in position to the order's checkin route", async () => {
    vi.mocked(orderApiFetch).mockImplementation(() => json({ accepted: true }));

    await checkInAtShop("o-1", {
      latitude: 6.9,
      longitude: 79.8,
      capturedAt: "2026-09-24T04:30:00.000Z",
      accuracyMeters: 10,
    });

    const [path, options] = vi.mocked(orderApiFetch).mock.calls[0]!;
    expect(path).toBe("/api/orders/o-1/checkin");
    expect(JSON.parse(String(options?.body))).toMatchObject({ latitude: 6.9, accuracyMeters: 10 });
  });

  it("surfaces the measured distance from a rejected check-in", async () => {
    vi.mocked(orderApiFetch).mockImplementation(() =>
      json(
        { detail: "You are 342 m from the shop", distanceMeters: 342.5, radiusMeters: 300 },
        403,
      ),
    );

    await expect(
      checkInAtShop("o-1", { latitude: 6.9, longitude: 79.8, capturedAt: "x" }),
    ).rejects.toMatchObject({ status: 403, body: { distanceMeters: 342.5, radiusMeters: 300 } });
  });

  it("records cash only", async () => {
    vi.mocked(orderApiFetch).mockImplementation(() => json({ paymentId: "p-1" }, 201));

    await recordCashPayment("o-1", 2400);

    const [path, options] = vi.mocked(orderApiFetch).mock.calls[0]!;
    expect(path).toBe("/api/orders/o-1/payment");
    expect(JSON.parse(String(options?.body))).toEqual({ amount: 2400, method: "Cash" });
  });
});
