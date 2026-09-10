import { beforeEach, describe, expect, it, vi } from "vitest";
import { catalogApiFetch as apiFetch } from "@/api/client";
import { fetchProductPriceHistory, fetchProducts } from "./api";

vi.mock("@/api/client", () => ({ catalogApiFetch: vi.fn() }));

describe("product catalogue filters", () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
    vi.mocked(apiFetch).mockResolvedValue(new Response(JSON.stringify({ items: [] })));
  });

  it("requests active products by default", async () => {
    await fetchProducts({ page: 1, pageSize: 10 });
    const url = new URL(String(vi.mocked(apiFetch).mock.calls[0]![0]), "https://localhost");
    expect(url.searchParams.get("status")).toBe("Active");
  });

  it.each(["Active", "Inactive", "all"])(
    "sends %s with search and pagination to the server",
    async (status) => {
      await fetchProducts({ status, search: " tea ", page: 2, pageSize: 10 });
      const url = new URL(String(vi.mocked(apiFetch).mock.calls[0]![0]), "https://localhost");
      expect(Object.fromEntries(url.searchParams)).toEqual({
        status,
        search: "tea",
        page: "2",
        pageSize: "10",
      });
    },
  );
});

describe("product price history", () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
    vi.mocked(apiFetch).mockResolvedValue(new Response(JSON.stringify([])));
  });

  it("requests the audit history for the selected product", async () => {
    await fetchProductPriceHistory("product-123");

    expect(apiFetch).toHaveBeenCalledWith("/api/products/product-123/price-history");
  });
});
