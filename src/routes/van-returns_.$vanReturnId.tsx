import { createFileRoute } from "@tanstack/react-router";
import { RouteGuard } from "@/auth/RouteGuard";
import { VanReturnDetailPage } from "@/features/van-returns/VanReturnDetailPage";

export const Route = createFileRoute("/van-returns_/$vanReturnId")({
  head: () => ({ meta: [{ title: "Van return — Sellora" }] }),
  component: VanReturnRoute,
});

function VanReturnRoute() {
  const { vanReturnId } = Route.useParams();

  return (
    <RouteGuard>
      <VanReturnDetailPage vanReturnId={vanReturnId} />
    </RouteGuard>
  );
}
