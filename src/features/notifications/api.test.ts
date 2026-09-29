import { beforeEach, describe, expect, it, vi } from "vitest";
import { notificationApiFetch } from "@/api/client";
import {
  fetchFailedNotifications,
  fetchNotificationHealth,
  fetchNotificationSettings,
  resendNotification,
  updateNotificationSettings,
} from "./api";

vi.mock("@/api/client", () => ({ notificationApiFetch: vi.fn() }));

const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status }));

describe("notifications API", () => {
  beforeEach(() => vi.mocked(notificationApiFetch).mockReset());

  it("asks for the failed list", async () => {
    vi.mocked(notificationApiFetch).mockImplementation(() => json({ items: [] }));

    await fetchFailedNotifications(2, 20);

    expect(vi.mocked(notificationApiFetch).mock.calls[0]![0]).toBe(
      "/api/notifications?status=failed&page=2&pageSize=20",
    );
  });

  it("posts corrected addresses with a resend", async () => {
    vi.mocked(notificationApiFetch).mockImplementation(() => json({ status: "Sent" }));

    await resendNotification("n-1", [{ kind: "Agency", email: "orders@agency.lk" }]);

    const [path, options] = vi.mocked(notificationApiFetch).mock.calls[0]!;
    expect(path).toBe("/api/notifications/n-1/resend");
    expect(options?.method).toBe("POST");
    expect(JSON.parse(String(options?.body))).toEqual({
      recipients: [{ kind: "Agency", email: "orders@agency.lk" }],
    });
  });

  it("surfaces the server's reason", async () => {
    vi.mocked(notificationApiFetch).mockImplementation(() =>
      json(
        { detail: "Every recipient already has this notification; there is nothing to resend." },
        409,
      ),
    );

    await expect(resendNotification("n-1", [])).rejects.toMatchObject({ status: 409 });
  });

  it("reads the health count", async () => {
    vi.mocked(notificationApiFetch).mockImplementation(() => json({ needsAttention: 3 }));

    expect((await fetchNotificationHealth()).needsAttention).toBe(3);
    expect(vi.mocked(notificationApiFetch).mock.calls[0]![0]).toBe("/api/notifications/health");
  });

  it("reads and saves the company alert address", async () => {
    vi.mocked(notificationApiFetch).mockImplementation(() => json({ alertEmail: "ops@acme.lk" }));

    expect((await fetchNotificationSettings()).alertEmail).toBe("ops@acme.lk");
    await updateNotificationSettings(null);

    const [path, options] = vi.mocked(notificationApiFetch).mock.calls[1]!;
    expect(path).toBe("/api/notifications/settings");
    expect(options?.method).toBe("PUT");
    expect(JSON.parse(String(options?.body))).toEqual({ alertEmail: null });
  });
});
