import { describe, expect, it } from "vitest";
import {
  canAccessAudit,
  canVerifyAudit,
  extractCheckInCoordinates,
  formatAuditTimestamp,
  formatEventType,
  formatPayload,
  formatVerificationReason,
  googleMapsUrl,
  parseAuditSearchParams,
  shortenHash,
} from "./auditView";

describe("auditView helpers", () => {
  it("allows only CompanyAdmin and AreaManager to access audit", () => {
    expect(canAccessAudit("CompanyAdmin")).toBe(true);
    expect(canAccessAudit("AreaManager")).toBe(true);
    expect(canAccessAudit("AgencyOperator")).toBe(false);
    expect(canAccessAudit("SalesRep")).toBe(false);
    expect(canAccessAudit("ShopOwner")).toBe(false);
    expect(canAccessAudit(null)).toBe(false);
  });

  it("allows only CompanyAdmin to verify audit chain", () => {
    expect(canVerifyAudit("CompanyAdmin")).toBe(true);
    expect(canVerifyAudit("AreaManager")).toBe(false);
    expect(canVerifyAudit("AgencyOperator")).toBe(false);
    expect(canVerifyAudit(null)).toBe(false);
  });

  it("formats audit timestamp in Asia/Colombo (+05:30) time", () => {
    // 2026-10-14T02:30:00Z is 08:00:00 AM in Asia/Colombo
    const result = formatAuditTimestamp("2026-10-14T02:30:00Z");
    expect(result).toMatch(/14 Oct 2026/);
    expect(result).toMatch(/08:00:00/);
  });

  it("formats known event types into readable titles", () => {
    expect(formatEventType("order.placed")).toBe("Order Placed");
    expect(formatEventType("PaymentRecorded")).toBe("Payment Recorded");
    expect(formatEventType("delivery.status_changed")).toBe("Delivery Status Changed");
    expect(formatEventType("return.requested")).toBe("Return Requested");
    expect(formatEventType("custom_audit_event")).toBe("Custom Audit Event");
  });

  it("shortens long cryptographic hashes with ellipsis", () => {
    const fullHash = "a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890";
    const shortened = shortenHash(fullHash, 8, 8);
    expect(shortened).toBe("a1b2c3d4…34567890");
    expect(shortenHash("short")).toBe("short");
    expect(shortenHash("")).toBe("");
  });

  it("pretty-prints JSON payloads and returns non-JSON as-is", () => {
    const rawJson = '{"amount":1500,"orderId":"ord-1"}';
    const formatted = formatPayload(rawJson);
    expect(formatted).toBe('{\n  "amount": 1500,\n  "orderId": "ord-1"\n}');

    const invalid = "raw text not json";
    expect(formatPayload(invalid)).toBe("raw text not json");
    expect(formatPayload("")).toBe("");
  });

  it("extracts coordinates from various checkout/checkin payload formats", () => {
    expect(
      extractCheckInCoordinates('{"checkoutLatitude":6.9271,"checkoutLongitude":79.8612}'),
    ).toEqual({ latitude: 6.9271, longitude: 79.8612 });

    expect(
      extractCheckInCoordinates('{"checkIn":{"latitude":6.9271,"longitude":79.8612}}'),
    ).toEqual({ latitude: 6.9271, longitude: 79.8612 });

    expect(extractCheckInCoordinates('{"latitude":6.9271,"longitude":79.8612}')).toEqual({
      latitude: 6.9271,
      longitude: 79.8612,
    });

    expect(extractCheckInCoordinates('{"invalid": true}')).toBeNull();
    expect(extractCheckInCoordinates("not json")).toBeNull();
  });

  it("builds google maps search URL", () => {
    expect(googleMapsUrl(6.9271, 79.8612)).toBe(
      "https://www.google.com/maps/search/?api=1&query=6.9271%2C79.8612",
    );
  });

  it("formats verification reasons in plain language", () => {
    expect(formatVerificationReason("HashMismatch")).toContain("recorded hash does not match");
    expect(formatVerificationReason("PreviousHashMismatch")).toContain("preceding entry is broken");
    expect(formatVerificationReason("MissingPosition")).toContain("missing from the chain");
    expect(formatVerificationReason("OtherReason")).toBe("OtherReason");
  });

  it("parses URL search parameters cleanly", () => {
    const parsed = parseAuditSearchParams({
      orderReference: " ORD-99 ",
      page: "2",
      from: "2026-10-01",
      entry: "entry-abc",
    });

    expect(parsed.orderReference).toBe("ORD-99");
    expect(parsed.page).toBe(2);
    expect(parsed.from).toBe("2026-10-01");
    expect(parsed.entry).toBe("entry-abc");
    expect(parsed.pageSize).toBe(20);
    expect(parsed.to).toBeUndefined();
  });
});
