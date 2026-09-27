import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { shouldRetry } from "./features/dashboard/queryPolicy";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  // App-wide defaults that keep the backend calm, most of all right after
  // login when every screen mounts at once:
  // - data counts as fresh for 30 s, so remounting a page does not refetch;
  // - no refetch just because the window regained focus;
  // - a 4xx is an answer (403 for a role, 404, 429 "slow down") and is never
  //   retried; an outage is retried once instead of React Query's default 3.
  // Mutations still invalidate what they change, so edits show immediately.
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: shouldRetry,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
