import { describe, expect, it } from "vitest";
import {
  formatNotificationStatus,
  isWellFormedEmail,
  statusTone,
  unsentRecipients,
} from "./notificationView";
import type { NotificationRequest } from "./types";

describe("failed notification view", () => {
  it("names statuses for an admin", () => {
    expect(formatNotificationStatus("PermanentlyFailed")).toBe("Gave up");
    expect(formatNotificationStatus("Failed")).toBe("Retrying");
    expect(statusTone("PermanentlyFailed")).toBe("danger");
    expect(statusTone("PartiallySent")).toBe("warning");
  });

  it("offers resend only for recipients not yet sent to", () => {
    const request = {
      recipients: [
        { kind: "Shop", deliveryStatus: "Sent" },
        { kind: "Agency", deliveryStatus: "PermanentlyFailed" },
      ],
    } as NotificationRequest;

    expect(unsentRecipients(request).map((recipient) => recipient.kind)).toEqual(["Agency"]);
  });

  it("checks addresses the way the server does", () => {
    expect(isWellFormedEmail("orders@agency.lk")).toBe(true);
    for (const bad of ["not-an-email", "a@b", "two@@x.lk", "sp ace@x.lk", "dot@.x.lk", ""]) {
      expect(isWellFormedEmail(bad)).toBe(false);
    }
  });
});
