import { createFileRoute } from "@tanstack/react-router";
import { RouteGuard } from "@/auth/RouteGuard";
import { FailedNotificationsPage } from "@/features/notifications/FailedNotificationsPage";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Failed notifications — Sellora" }] }),
  component: () => (
    <RouteGuard>
      <FailedNotificationsPage />
    </RouteGuard>
  ),
});
