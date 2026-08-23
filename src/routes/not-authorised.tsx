import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/not-authorised")({
  head: () => ({
    meta: [
      { title: "Not authorised — Sellora" },
      { name: "description", content: "You do not have permission to view this page in Sellora." },
      { property: "og:title", content: "Not authorised — Sellora" },
      { property: "og:description", content: "You do not have permission to view this page in Sellora." },
    ],
  }),
  component: NotAuthorised,
});

function NotAuthorised() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <ShieldAlert className="size-8 text-muted-foreground" />
      <h1 className="mt-4 text-xl font-semibold tracking-tight">Not authorised</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Your role does not have permission to view this page. Contact an administrator if you
        believe this is a mistake.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
