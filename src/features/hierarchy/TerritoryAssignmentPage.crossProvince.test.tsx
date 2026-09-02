// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TerritoryAssignmentPage } from "./TerritoryAssignmentPage";

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
    fetchUnassignedTerritories: vi.fn(),
    fetchAgencies: vi.fn(),
    assignTerritoryToAgency: vi.fn(),
}));

vi.mock("./api", () => api);

function renderPage() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    render(
        <QueryClientProvider client={queryClient}>
            <TerritoryAssignmentPage />
        </QueryClientProvider>,
    );
}

// ---- Test Data ----
const westernTerritory = {
    territoryId: "territory-wp-01",
    provinceId: "province-western",
    code: "WP-T-01",
    name: "Colombo North",
    status: "Active" as const,
    createdAt: "2026-01-01T00:00:00Z",
};
const westernAgency = {
    agencyId: "agency-wp-01",
    provinceId: "province-western",
    name: "Western Agency Ltd",
    status: "Active" as const,
    createdAt: "2026-01-01T00:00:00Z",
};
const southernAgency = {
    agencyId: "agency-sp-01",
    provinceId: "province-southern",
    name: "Southern Agency Ltd",
    status: "Active" as const,
    createdAt: "2026-01-01T00:00:00Z",
};


describe("CSP-77 — TerritoryAssignmentPage cross-province guard", () => {
    afterEach(cleanup);

    // TC-01: Dropdown only shows same-province agencies
    it("TC-01: dropdown disables when no same-province agency exists", async () => {
        api.fetchUnassignedTerritories.mockResolvedValue({
            items: [westernTerritory],
            totalCount: 1, page: 1, pageSize: 100,
        });
        api.fetchAgencies.mockResolvedValue({
            items: [southernAgency], // Different province — should not appear
            totalCount: 1, page: 1, pageSize: 100,
        });

        renderPage();
        await screen.findByText("Colombo North");

        // Assign button should be disabled (no valid agency) — check HTML attribute directly
        const button = screen.getByRole("button", { name: "Assign" });
        expect(button).toHaveProperty("disabled", true);

        // API should never be called
        expect(api.assignTerritoryToAgency).not.toHaveBeenCalled();
    });

    // TC-02: Cross-province visible — only same province in dropdown
    it("TC-02: only same-province agencies visible in dropdown", async () => {
        api.fetchUnassignedTerritories.mockResolvedValue({
            items: [westernTerritory],
            totalCount: 1, page: 1, pageSize: 100,
        });
        api.fetchAgencies.mockResolvedValue({
            items: [westernAgency, southernAgency], // Both provinces
            totalCount: 2, page: 1, pageSize: 100,
        });

        renderPage();
        await screen.findByText("Colombo North");

        expect(screen.getByText("Western Agency Ltd")).toBeTruthy();
        expect(screen.queryByText("Southern Agency Ltd")).toBeNull(); // ← Must NOT show
    });

    // TC-03: API returns 403 → inline error shown
    it("TC-03: shows province mismatch error when API returns 403", async () => {
        api.fetchUnassignedTerritories.mockResolvedValue({
            items: [westernTerritory],
            totalCount: 1, page: 1, pageSize: 100,
        });
        api.fetchAgencies.mockResolvedValue({
            items: [westernAgency],
            totalCount: 1, page: 1, pageSize: 100,
        });
        api.assignTerritoryToAgency.mockRejectedValue(
            new api.ApiProblem(403, "Territory province does not match agency province."),
        );

        renderPage();
        await screen.findByText("Colombo North");

        fireEvent.change(screen.getByLabelText("Agency for Colombo North"), {
            target: { value: "agency-wp-01" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Assign" }));

        const alert = await screen.findByRole("alert");
        expect(alert.textContent).toContain("Territory province does not match agency province.");
    });

    // TC-04: Territory stays in list after rejection
    it("TC-04: territory remains unassigned after a rejected assignment", async () => {
        api.fetchUnassignedTerritories.mockResolvedValue({
            items: [westernTerritory],
            totalCount: 1, page: 1, pageSize: 100,
        });
        api.fetchAgencies.mockResolvedValue({
            items: [westernAgency],
            totalCount: 1, page: 1, pageSize: 100,
        });
        api.assignTerritoryToAgency.mockRejectedValue(
            new api.ApiProblem(403, "Province mismatch."),
        );

        renderPage();
        await screen.findByText("Colombo North");

        fireEvent.change(screen.getByLabelText("Agency for Colombo North"), {
            target: { value: "agency-wp-01" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Assign" }));

        await screen.findByRole("alert");
        // Territory still visible — not removed
        expect(screen.getByText("Colombo North")).toBeTruthy();
    });

    // TC-05: Success — same-province assignment calls API correctly
    it("TC-05: successful same-province assignment calls API with correct territory and agency", async () => {
        api.fetchUnassignedTerritories.mockResolvedValue({
            items: [westernTerritory],
            totalCount: 1, page: 1, pageSize: 100,
        });
        api.fetchAgencies.mockResolvedValue({
            items: [westernAgency],
            totalCount: 1, page: 1, pageSize: 100,
        });
        api.assignTerritoryToAgency.mockResolvedValue({
            assignmentId: "assign-01",
            territoryId: "territory-wp-01",
            agencyId: "agency-wp-01",
            startsAt: "2026-09-03T00:00:00Z",
        });

        renderPage();
        await screen.findByText("Colombo North");

        fireEvent.change(screen.getByLabelText("Agency for Colombo North"), {
            target: { value: "agency-wp-01" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Assign" }));

        // Verify the mutation was called with the correct same-province IDs
        await vi.waitFor(() => {
            expect(api.assignTerritoryToAgency).toHaveBeenCalledWith(
                "territory-wp-01",
                "agency-wp-01",
            );
        });

        // No inline error — assignment was accepted
        expect(screen.queryByRole("alert")).toBeNull();
    });
});
