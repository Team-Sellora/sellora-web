import { createFileRoute } from "@tanstack/react-router";
import { RouteGuard } from "@/auth/RouteGuard";
import { DeclareVanReturnPage } from "@/features/van-returns/DeclareVanReturnPage";

export const Route = createFileRoute("/van-returns_/new")({
  head: () => ({ meta: [{ title: "Return van stock — Sellora" }] }),
  component: () => (
    <RouteGuard>
      <DeclareVanReturnPage />
    </RouteGuard>
  ),
});
