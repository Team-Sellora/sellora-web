import { createFileRoute } from "@tanstack/react-router";
import { RouteGuard } from "@/auth/RouteGuard";
import { StaffPage } from "@/features/staff/StaffPage";

export const Route = createFileRoute("/staff")({
  head: () => ({
    meta: [
      { title: "Team — Sellora" },
      { name: "description", content: "Add staff members and create their logins." },
    ],
  }),
  component: () => (
    <RouteGuard>
      <StaffPage />
    </RouteGuard>
  ),
});
