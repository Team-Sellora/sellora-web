import { createFileRoute } from "@tanstack/react-router";
import { TerritoryAssignmentPage } from "@/features/hierarchy/TerritoryAssignmentPage";
import { RouteGuard } from "@/auth/RouteGuard";

export const Route = createFileRoute("/territory-assignments")({
  component: TerritoryAssignmentsRoute,
});

function TerritoryAssignmentsRoute() {
  return (
    <RouteGuard>
      <TerritoryAssignmentPage />
    </RouteGuard>
  );
}
