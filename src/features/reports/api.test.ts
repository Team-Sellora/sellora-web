import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

vi.mock("@/config/env", () => ({
  env: {
    gatewayBaseUrl: "https://organization.example",
    auditGatewayBaseUrl: "https://audit.example",
  },
}));

vi.mock("@/api/tokenStore", () => ({ getAccessToken: () => "mock-jwt" }));

import {
  buildSalesBreakdownParams,
  buildSalesSummaryParams,
  fetchSalesBreakdown,
  fetchSalesSummary,
} from "./api";
import { ReportsApiError } from "./apiError";

describe("reports API client and query parameter builder", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("builds summary query parameters omitting comparison when not provided", () => {
    const params = buildSalesSummaryParams({
      from: "2026-10-01",
      to: "2026-10-14",
    });

    expect(params.get("from")).toBe("2026-10-01");
    expect(params.get("to")).toBe("2026-10-14");
    expect(params.has("compareFrom")).toBe(false);
    expect(params.has("compareTo")).toBe(false);
  });

  it("builds summary query parameters including compareFrom and compareTo when compare is active", () => {
    const params = buildSalesSummaryParams({
      from: "2026-10-01",
      to: "2026-10-14",
      compareFrom: "2026-09-17",
      compareTo: "2026-09-30",
    });

    expect(params.get("from")).toBe("2026-10-01");
    expect(params.get("to")).toBe("2026-10-14");
    expect(params.get("compareFrom")).toBe("2026-09-17");
    expect(params.get("compareTo")).toBe("2026-09-30");
  });

  it("builds breakdown query parameters per groupBy dimension", () => {
    const repParams = buildSalesBreakdownParams({
      groupBy: "rep",
      from: "2026-10-01",
      to: "2026-10-14",
    });
    expect(repParams.get("groupBy")).toBe("rep");
    expect(repParams.get("from")).toBe("2026-10-01");
    expect(repParams.get("to")).toBe("2026-10-14");

    const territoryParams = buildSalesBreakdownParams({
      groupBy: "territory",
      from: "2026-10-01",
      to: "2026-10-14",
      sort: "value",
      direction: "desc",
    });
    expect(territoryParams.get("groupBy")).toBe("territory");
    expect(territoryParams.get("sort")).toBe("value");
    expect(territoryParams.get("direction")).toBe("desc");

    const agencyParams = buildSalesBreakdownParams({
      groupBy: "agency",
      from: "2026-10-01",
      to: "2026-10-14",
    });
    expect(agencyParams.get("groupBy")).toBe("agency");

    const productParams = buildSalesBreakdownParams({
      groupBy: "product",
      from: "2026-10-01",
      to: "2026-10-14",
    });
    expect(productParams.get("groupBy")).toBe("product");
  });

  it("fetches sales summary successfully", async () => {
    const mockSummary = {
      from: "2026-10-01",
      to: "2026-10-14",
      currency: "LKR",
      totals: {
        salesValue: 500000,
        orderCount: 20,
        averageOrderValue: 25000,
        expected: 500000,
        collected: 450000,
        outstanding: 50000,
      },
      statusBreakdown: [{ status: "Confirmed", count: 20 }],
      daily: [{ date: "2026-10-01", salesValue: 500000, orderCount: 20 }],
      comparison: null,
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockSummary),
    });

    const res = await fetchSalesSummary({ from: "2026-10-01", to: "2026-10-14" });
    expect(res.totals.salesValue).toBe(500000);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://audit.example/api/reports/sales-summary?from=2026-10-01&to=2026-10-14",
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    );
  });

  it("maps 400 ProblemDetails errors to ReportsApiError with server detail", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () =>
        Promise.resolve({
          title: "Bad Request",
          detail: "Date range cannot exceed 1,100 days.",
        }),
    });

    await expect(fetchSalesSummary({ from: "2020-01-01", to: "2026-10-14" })).rejects.toThrowError(
      ReportsApiError,
    );
  });

  it("maps 403 Forbidden errors to ReportsApiError", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ detail: "Forbidden role access" }),
    });

    await expect(
      fetchSalesBreakdown({ groupBy: "rep", from: "2026-10-01", to: "2026-10-14" }),
    ).rejects.toThrowError(ReportsApiError);
  });

  it("maps 503 error to custom Organization service notice when detail is missing", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: () => Promise.reject(new Error("Non-JSON")),
    });

    try {
      await fetchSalesSummary({ from: "2026-10-01", to: "2026-10-14" });
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(ReportsApiError);
      const apiErr = err as ReportsApiError;
      expect(apiErr.status).toBe(503);
      expect(apiErr.detail).toBe(
        "Organization service is unavailable, some area names may be missing",
      );
    }
  });
});
