import { createFileRoute } from "@tanstack/react-router";
import { RouteGuard } from "@/auth/RouteGuard";
import { AuditPage } from "@/features/audit/AuditPage";
import { parseAuditSearchParams } from "@/features/audit/auditView";

export const Route = createFileRoute("/audit")({
  validateSearch: (search: Record<string, unknown>) => parseAuditSearchParams(search),
  head: () => ({
    meta: [
      { title: "Audit log — Sellora" },
      {
        name: "description",
        content: "Cryptographic immutable append-only audit trail of all business events.",
      },
      { property: "og:title", content: "Audit log — Sellora" },
      {
        property: "og:description",
        content: "Cryptographic immutable append-only audit trail of all business events.",
      },
    ],
  }),
  component: AuditRouteComponent,
});

function AuditRouteComponent() {
  const search = Route.useSearch();
  return (
    <RouteGuard>
      <AuditPage searchParams={search} />
    </RouteGuard>
  );
}
