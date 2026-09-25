import { describe, expect, it } from "vitest";
import { canDecideApproval, formatDecision, rejectionReasonError } from "./approvalView";
import type { Order } from "./types";

const pending = {
  fulfilmentType: "ScheduledDelivery",
  status: "PendingApproval",
} as Order;

describe("agency approval view", () => {
  it("lets only an agency operator decide a pending scheduled delivery", () => {
    expect(canDecideApproval("AgencyOperator", pending)).toBe(true);
    expect(canDecideApproval("CompanyAdmin", pending)).toBe(false);
    expect(canDecideApproval("ShopOwner", pending)).toBe(false);
    expect(canDecideApproval("AgencyOperator", { ...pending, status: "Confirmed" })).toBe(false);
    expect(canDecideApproval("AgencyOperator", { ...pending, status: "Cancelled" })).toBe(false);
    expect(
      canDecideApproval("AgencyOperator", { ...pending, fulfilmentType: "ImmediateCashSale" }),
    ).toBe(false);
  });

  it("requires a reason to reject", () => {
    expect(rejectionReasonError("")).toMatch(/reason/i);
    expect(rejectionReasonError("   ")).toMatch(/reason/i);
    expect(rejectionReasonError("x".repeat(501))).toMatch(/500/);
    expect(rejectionReasonError("Unpaid invoice")).toBeNull();
  });

  it("labels decisions in plain words", () => {
    expect(formatDecision("CancelledByShop")).toBe("Cancelled by the shop");
    expect(formatDecision("Approved")).toBe("Approved by the agency");
  });
});
