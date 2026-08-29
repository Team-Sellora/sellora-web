// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HierarchyRollUpPage } from "./HierarchyRollUpPage";

const api = vi.hoisted(() => ({
  ApiProblem: class ApiProblem extends Error {
    constructor(
      public readonly status: number,
      public readonly detail?: string,
      public readonly title?: string,
    ) {
      super(detail || title || `Request failed (${status})`);
    }
  },
  fetchCompanyAdmins: vi.fn(),
  fetchHierarchyRollUp: vi.fn(),
  updateAreaManagerReportsTo: vi.fn(),
}));

vi.mock("./api", () => api);

vi.mock("@/components/PageHeader", () => ({
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <HierarchyRollUpPage />
    </QueryClientProvider>,
  );
}

describe("HierarchyRollUpPage", () => {
  it("highlights a province with an unassigned territory", async () => {
    api.fetchCompanyAdmins.mockResolvedValue([
      {
        staffProfileId: "admin-1",
        displayName: "Primary Admin",
        email: "admin@sellora.test",
        status: "Active",
      },
    ]);
    api.fetchHierarchyRollUp.mockResolvedValue([
      {
        provinceId: "western",
        code: "WP",
        name: "Western Province",
        status: "Active",
        currentManager: {
          staffProfileId: "manager-1",
          displayName: "Nimal Fernando",
          reportsToAdmin: { staffProfileId: "admin-1", displayName: "Primary Admin" },
        },
        agencyCount: 1,
        territoryCount: 2,
        shopCount: 2,
        unassignedTerritoryCount: 1,
        hasUnassignedTerritories: true,
      },
      {
        provinceId: "southern",
        code: "SP",
        name: "Southern Province",
        status: "Active",
        currentManager: null,
        agencyCount: 1,
        territoryCount: 1,
        shopCount: 1,
        unassignedTerritoryCount: 0,
        hasUnassignedTerritories: false,
      },
    ]);

    renderPage();

    expect(await screen.findByText("1 unassigned")).not.toBeNull();
    expect(screen.getByText("Fully assigned")).not.toBeNull();
    expect(screen.getByText("Western Province").closest("tr")?.className).toContain("bg-amber-50");
  });
});
