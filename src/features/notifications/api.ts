import { notificationApiFetch } from "@/api/client";
import {
  NotificationApiError,
  type CorrectedAddress,
  type NotificationHealth,
  type NotificationRequest,
  type NotificationSettings,
  type PagedNotifications,
} from "./types";

async function unwrap<T>(response: Response): Promise<T> {
  if (response.ok) {
    return (await response.json()) as T;
  }

  let detail: string | undefined;
  try {
    const body = (await response.json()) as { detail?: string; title?: string };
    detail = body.detail ?? body.title;
  } catch {
    // No JSON body: keep the status.
  }

  throw new NotificationApiError(response.status, detail);
}

/** US-E5-3-T4: everything not fully delivered — Failed, PartiallySent, PermanentlyFailed. */
export function fetchFailedNotifications(
  page: number,
  pageSize: number,
): Promise<PagedNotifications> {
  const parameters = new URLSearchParams({
    status: "failed",
    page: String(page),
    pageSize: String(pageSize),
  });
  return notificationApiFetch(`/api/notifications?${parameters.toString()}`).then(
    unwrap<PagedNotifications>,
  );
}

/** Sends again to every recipient not yet sent to, optionally at corrected addresses. */
export function resendNotification(
  notificationRequestId: string,
  corrected: CorrectedAddress[],
): Promise<NotificationRequest> {
  return notificationApiFetch(
    `/api/notifications/${encodeURIComponent(notificationRequestId)}/resend`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipients: corrected }),
    },
  ).then(unwrap<NotificationRequest>);
}

/** US-E5-4: the company alert address used for low-stock notifications. */
export function fetchNotificationSettings(): Promise<NotificationSettings> {
  return notificationApiFetch("/api/notifications/settings").then(unwrap<NotificationSettings>);
}

export function updateNotificationSettings(
  alertEmail: string | null,
): Promise<NotificationSettings> {
  return notificationApiFetch("/api/notifications/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ alertEmail }),
  }).then(unwrap<NotificationSettings>);
}

/** US-E5-3-T5: counts for the dashboard. */
export function fetchNotificationHealth(): Promise<NotificationHealth> {
  return notificationApiFetch("/api/notifications/health").then(unwrap<NotificationHealth>);
}
