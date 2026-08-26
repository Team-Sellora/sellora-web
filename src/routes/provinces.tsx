import { createFileRoute } from "@tanstack/react-router";
import { RouteGuard } from "@/auth/RouteGuard";
import { ProvinceListPage } from "@/features/provinces/ProvinceListPage";

export const Route = createFileRoute("/provinces")({
  head: () => ({
    meta: [
      { title: "Provinces — Sellora" },
      {
        name: "description",
        content: "Provinces in your company with current Area Manager and counts.",
      },
      { property: "og:title", content: "Provinces — Sellora" },
      {
        property: "og:description",
        content: "Provinces in your company with current Area Manager and counts.",
      },
    ],
  }),
  component: () => (
    <RouteGuard>
      <ProvinceListPage />
    </RouteGuard>
  ),
});
