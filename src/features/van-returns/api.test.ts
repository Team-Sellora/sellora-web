import { beforeEach, describe, expect, it, vi } from "vitest";
import { orderApiFetch } from "@/api/client";
import { acceptVanReturn, declareVanReturn, fetchVanReturns } from "./api";

vi.mock("@/api/client", () => ({ orderApiFetch: vi.fn() }));

const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status }));

describe("van returns API", () => {
  beforeEach(() => vi.mocked(orderApiFetch).mockReset());

  it("posts only the products being returned", async () => {
    vi.mocked(orderApiFetch).mockImplementation(() => json({ vanReturnId: "v-1" }, 201));

    await declareVanReturn([
      { productId: "soap", quantity: 12 },
      { productId: "tea", quantity: 0 },
    ]);

    const [path, options] = vi.mocked(orderApiFetch).mock.calls[0]!;
    expect(path).toBe("/api/van-returns");
    expect(options?.method).toBe("POST");
    expect(JSON.parse(String(options?.body))).toEqual({
      lines: [{ productId: "soap", quantity: 12 }],
    });
  });

  it("surfaces the shortage when the van holds less", async () => {
    vi.mocked(orderApiFetch).mockImplementation(() =>
      json(
        {
          detail: "Your van holds only 30 units of Soap; 40 cannot be returned.",
          shortages: [
            { productId: "soap", productName: "Soap", requestedQuantity: 40, heldQuantity: 30 },
          ],
        },
        422,
      ),
    );

    await expect(declareVanReturn([{ productId: "soap", quantity: 40 }])).rejects.toMatchObject({
      status: 422,
      body: { shortages: [{ heldQuantity: 30 }] },
    });
  });

  it("puts the counts on the acceptance sub-resource", async () => {
    vi.mocked(orderApiFetch).mockImplementation(() => json({ vanReturnId: "v-1" }));

    await acceptVanReturn("v-1", [{ productId: "soap", countedQuantity: 10 }], " Two crushed ");

    const [path, options] = vi.mocked(orderApiFetch).mock.calls[0]!;
    expect(path).toBe("/api/van-returns/v-1/acceptance");
    expect(options?.method).toBe("PUT");
    expect(JSON.parse(String(options?.body))).toEqual({
      lines: [{ productId: "soap", countedQuantity: 10 }],
      note: "Two crushed",
    });
  });

  it("asks for the pending list by status", async () => {
    vi.mocked(orderApiFetch).mockImplementation(() => json({ items: [] }));

    await fetchVanReturns({ page: 1, pageSize: 20, status: "Declared" });

    expect(vi.mocked(orderApiFetch).mock.calls[0]![0]).toBe(
      "/api/van-returns?page=1&pageSize=20&status=Declared",
    );
  });
});
