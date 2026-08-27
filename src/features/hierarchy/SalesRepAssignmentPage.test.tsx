// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApiProblem } from "./api";
import { SalesRepAssignmentPage } from "./SalesRepAssignmentPage";

const api = vi.hoisted(() => ({
  fetchSalesReps: vi.fn(),
  fetchUnassignedRepTerritories: vi.fn(),
  assignSalesRepToTerritory: vi.fn(),
}));

vi.mock("./api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./api")>();
  return { ...actual, ...api };
});

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <SalesRepAssignmentPage />
    </QueryClientProvider>,
  );
}

describe("SalesRepAssignmentPage", () => {
  it("shows an inline conflict error when an assignment is rejected", async () => {
    api.fetchSalesReps.mockResolvedValue([
      {
        salesRepId: "rep-1",
        displayName: "Nimal Fernando",
        email: "nimal@sellora.test",
        status: "Active",
        currentTerritory: null,
      },
    ]);
    api.fetchUnassignedRepTerritories.mockResolvedValue([
      {
        territoryId: "territory-1",
        provinceId: "province-1",
        code: "W-01",
        name: "Western Territory",
        status: "Active",
        createdAt: "2026-01-01T00:00:00Z",
      },
    ]);
    api.assignSalesRepToTerritory.mockRejectedValue(
      new ApiProblem(409, "territory already has an active rep"),
    );

    renderPage();

    await screen.findByText("Nimal Fernando");

    fireEvent.change(screen.getByLabelText("Territory for Nimal Fernando"), {
      target: { value: "territory-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Assign" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "territory already has an active rep",
    );
  });
});
