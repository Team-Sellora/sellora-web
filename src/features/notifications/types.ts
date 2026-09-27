export type NotificationStatus =
  "Pending" | "Sent" | "PartiallySent" | "Failed" | "PermanentlyFailed" | (string & {});

export type RecipientKind = "Shop" | "Agency" | (string & {});

export interface NotificationRecipient {
  kind: RecipientKind;
  recipientId: string;
  name: string | null;
  email: string | null;
  deliveryStatus:
    "Pending" | "Sent" | "Failed" | "Unaddressed" | "PermanentlyFailed" | (string & {});
  sentAt: string | null;
  attempts: number;
  lastError: string | null;
  lastAttemptAt: string | null;
}

export interface NotificationAttempt {
  recipientKind: RecipientKind;
  emailAddress: string | null;
  attemptNumber: number;
  attemptedAt: string;
  outcome: "Sent" | "TransientFailure" | "PermanentFailure" | (string & {});
  providerResponse: string | null;
  error: string | null;
  trigger: "Automatic" | "ManualResend" | (string & {});
  triggeredBy: string | null;
}

export interface NotificationDispatch {
  attemptCount: number;
  lastAttemptAt: string | null;
  nextAttemptAt: string | null;
  completedAt: string | null;
  sendGapMilliseconds: number | null;
  toleranceMilliseconds: number;
  withinTolerance: boolean | null;
  renderedBodySha256: string | null;
}

export interface NotificationRequest {
  notificationRequestId: string;
  sourceEventId: string;
  eventType: string;
  templateKey: string;
  orderId: string;
  orderReference: string;
  status: NotificationStatus;
  occurredAt: string;
  receivedAt: string;
  correlationId: string | null;
  recipients: NotificationRecipient[];
  dispatch: NotificationDispatch;
  failureReason: string | null;
  lastResendAt: string | null;
  lastResendBy: string | null;
  attempts: NotificationAttempt[] | null;
}

export interface PagedNotifications {
  items: NotificationRequest[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface NotificationHealth {
  pending: number;
  failed: number;
  partiallySent: number;
  permanentlyFailed: number;
  needsAttention: number;
  oldestFailureAt: string | null;
}

export interface CorrectedAddress {
  kind: RecipientKind;
  email: string;
}

export class NotificationApiError extends Error {
  constructor(
    readonly status: number,
    readonly detail: string | undefined,
  ) {
    super(detail ?? `The notification service answered ${status}.`);
    this.name = "NotificationApiError";
  }
}
