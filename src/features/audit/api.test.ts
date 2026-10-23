import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

vi.mock("@/config/env", () => ({
  env: {
    gatewayBaseUrl: "https://organization.example",
    auditGatewayBaseUrl: "https://audit.example",
  },
}));

vi.mock("@/api/tokenStore", () => ({ getAccessToken: () => "mock-token" }));

import {
  buildAuditSearchParams,
  fetchAuditEntry,
  isAuditFilterValid,
  isDateRangeValid,
  searchAudit,
  toColomboEndInstant,
  toColomboStartInstant,
  verifyAuditChain,
} from "./api";
import { AuditApiError } from "./apiError";

describe("audit API parameter builder and date formatting", () => {
  it("converts calendar days into Asia/Colombo instants with +05:30", () => {
    expect(toColomboStartInstant("2026-10-14")).toBe("2026-10-14T00:00:00+05:30");
    expect(toColomboEndInstant("2026-10-14")).toBe("2026-10-14T23:59:59+05:30");
  });

  it("leaves already-formatted ISO strings unchanged", () => {
    const iso = "2026-10-14T04:30:00Z";
    expect(toColomboStartInstant(iso)).toBe(iso);
    expect(toColomboEndInstant(iso)).toBe(iso);
  });

  it("validates that from date is before or equal to to date", () => {
    expect(isDateRangeValid("2026-10-10", "2026-10-14")).toBe(true);
    expect(isDateRangeValid("2026-10-14", "2026-10-14")).toBe(true);
    expect(isDateRangeValid("2026-10-15", "2026-10-14")).toBe(false);
    expect(isDateRangeValid(undefined, "2026-10-14")).toBe(true);
    expect(isDateRangeValid("2026-10-14", undefined)).toBe(true);
    expect(isAuditFilterValid({ from: "2026-10-15", to: "2026-10-14" })).toBe(false);
    expect(isAuditFilterValid({ from: "2026-10-14", to: "2026-10-15" })).toBe(true);
  });

  it("builds query parameters with trimmed values, formatted dates and default pagination", () => {
    const params = buildAuditSearchParams({
      orderReference: " ORD-1001 ",
      aggregateType: "Order",
      aggregateId: " agg-1 ",
      actorUserId: " user-1 ",
      eventType: "order.placed",
      from: "2026-10-01",
      to: "2026-10-14",
    });

    expect(params.get("orderReference")).toBe("ORD-1001");
    expect(params.get("aggregateType")).toBe("Order");
    expect(params.get("aggregateId")).toBe("agg-1");
    expect(params.get("actorUserId")).toBe("user-1");
    expect(params.get("eventType")).toBe("order.placed");
    expect(params.get("from")).toBe("2026-10-01T00:00:00+05:30");
    expect(params.get("to")).toBe("2026-10-14T23:59:59+05:30");
    expect(params.get("page")).toBe("1");
    expect(params.get("pageSize")).toBe("20");
  });

  it("omits empty or whitespace-only search parameters", () => {
    const params = buildAuditSearchParams({
      orderReference: "  ",
      page: 3,
      pageSize: 50,
    });

    expect(params.has("orderReference")).toBe(false);
    expect(params.get("page")).toBe("3");
    expect(params.get("pageSize")).toBe("50");
  });
});

describe("audit API calls and error unwrapping", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("searches audit entries successfully", async () => {
    const mockResponse = {
      items: [
        {
          auditEntryId: "entry-1",
          chainPosition: 1,
          eventId: "evt-1",
          eventType: "order.placed",
          aggregateType: "Order",
          aggregateId: "order-1",
          orderReference: "ORD-1",
          actorUserId: "user-1",
          actorRole: "SalesRep",
          occurredAt: "2026-10-14T08:00:00Z",
          recordedAt: "2026-10-14T08:00:01Z",
          correlationId: "corr-1",
          sourceTopic: "order.events",
        },
      ],
      page: 1,
      pageSize: 20,
      totalCount: 1,
    };

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await searchAudit({ orderReference: "ORD-1" });
    expect(result).toEqual(mockResponse);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/audit?orderReference=ORD-1"),
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    );
  });

  it("fetches single audit entry detail", async () => {
    const mockDetail = {
      auditEntryId: "entry-123",
      chainPosition: 42,
      eventId: "evt-123",
      eventType: "PaymentRecorded",
      aggregateType: "Order",
      aggregateId: "ord-1",
      orderReference: "ORD-1",
      actorUserId: "rep-1",
      actorRole: "SalesRep",
      occurredAt: "2026-10-14T08:00:00Z",
      recordedAt: "2026-10-14T08:00:01Z",
      correlationId: "corr-1",
      sourceTopic: "order.events",
      schemaVersion: 1,
      provinceId: "prov-1",
      partition: 0,
      offset: 120,
      previousHash: "prev-hash-abc",
      hash: "hash-def",
      payload: '{"amount":5000}',
    };

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(mockDetail), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await fetchAuditEntry("entry-123");
    expect(result).toEqual(mockDetail);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://audit.example/api/audit/entry-123",
      expect.anything(),
    );
  });

  it("verifies audit chain integrity", async () => {
    const mockVerify = {
      verified: true,
      entriesChecked: 1500,
      firstBroken: null,
    };

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(mockVerify), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await verifyAuditChain();
    expect(result).toEqual(mockVerify);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://audit.example/api/audit/verify",
      expect.anything(),
    );
  });

  it("throws AuditApiError with status and detail on 400", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "from must be before to" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(searchAudit({})).rejects.toThrow(AuditApiError);
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "from must be before to" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    );
    try {
      await searchAudit({});
    } catch (err) {
      expect(err).toBeInstanceOf(AuditApiError);
      const auditErr = err as AuditApiError;
      expect(auditErr.status).toBe(400);
      expect(auditErr.detail).toBe("from must be before to");
    }
  });

  it("maps 403, 404, and 503 responses into AuditApiError", async () => {
    for (const status of [403, 404, 503]) {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ detail: `Error for ${status}` }), {
          status,
          headers: { "Content-Type": "application/json" },
        }),
      );

      await expect(fetchAuditEntry("entry-x")).rejects.toMatchObject({
        status,
        detail: `Error for ${status}`,
      });
    }
  });

  it("handles non-JSON error bodies gracefully", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("Service Unavailable", {
        status: 503,
      }),
    );

    await expect(verifyAuditChain()).rejects.toThrow(AuditApiError);
  });
});
