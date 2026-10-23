import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/not-authorised")({
  head: () => ({
    meta: [
      { title: "Not authorised — Sellora" },
      { name: "description", content: "You do not have permission to view this page in Sellora." },
      { property: "og:title", content: "Not authorised — Sellora" },
      {
        property: "og:description",
        content: "You do not have permission to view this page in Sellora.",
      },
    ],
  }),
  component: NotAuthorised,
});

function NotAuthorised() {
  return (
    <div className="access-card">
      <div className="access-icon">
        <ShieldAlert className="size-8" />
      </div>
      <span className="access-label">Access Restricted</span>
      <h1 className="mt-4 text-xl font-semibold tracking-tight">Not authorised</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Your role does not have permission to view this page. Contact an administrator if you
        believe this is a mistake.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex items-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
