// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ExportButtons } from "./ExportButtons";
import * as auth from "@/auth/useSelloraAuth";
import * as hooks from "../hooks";

vi.mock("@/auth/useSelloraAuth", () => ({
  useSelloraAuth: vi.fn(),
}));

vi.mock("../hooks", () => ({
  useRunExport: vi.fn(),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("ExportButtons component", () => {
  const runExportMock = vi.fn();

  beforeEach(() => {
    runExportMock.mockReset();
    vi.mocked(hooks.useRunExport).mockReturnValue({
      runExport: runExportMock,
      phase: "idle",
      isPending: false,
    });
    vi.mocked(auth.useSelloraAuth).mockReturnValue({
      role: "CompanyAdmin",
      isAuthenticated: true,
      isLoading: false,
      roles: ["CompanyAdmin"],
      companyId: "comp-1",
      accessToken: "token",
      username: "admin",
      logout: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders CSV and PDF buttons for reports on CompanyAdmin and sends correct payload", () => {
    render(
      <ExportButtons
        reportType="sales-breakdown"
        reportFilters={{
          from: "2026-10-01",
          to: "2026-10-14",
          groupBy: "rep",
          sort: "value",
          direction: "desc",
        }}
      />,
      { wrapper: createWrapper() },
    );

    const csvButton = screen.getByRole("button", { name: /export report as csv/i });
    const pdfButton = screen.getByRole("button", { name: /export report as pdf/i });
    expect(csvButton).toBeInTheDocument();
    expect(pdfButton).toBeInTheDocument();

    fireEvent.click(csvButton);

    expect(runExportMock).toHaveBeenCalledWith({
      reportType: "sales-breakdown",
      format: "csv",
      filters: {
        from: "2026-10-01",
        to: "2026-10-14",
        groupBy: "rep",
        sort: "value",
        direction: "desc",
      },
    });
  });

  it("switches to sales-summary via the dropdown", () => {
    render(
      <ExportButtons
        reportType="sales-breakdown"
        reportFilters={{
          from: "2026-10-01",
          to: "2026-10-14",
          compare: true,
          compareFrom: "2026-09-17",
          compareTo: "2026-09-30",
        }}
      />,
      { wrapper: createWrapper() },
    );

    const select = screen.getByRole("combobox", { name: /select report content to export/i });
    fireEvent.change(select, { target: { value: "sales-summary" } });

    const pdfButton = screen.getByRole("button", { name: /export report as pdf/i });
    fireEvent.click(pdfButton);

    expect(runExportMock).toHaveBeenCalledWith({
      reportType: "sales-summary",
      format: "pdf",
      filters: {
        from: "2026-10-01",
        to: "2026-10-14",
        compareFrom: "2026-09-17",
        compareTo: "2026-09-30",
      },
    });
  });

  it("is visible on reports for AreaManager role", () => {
    vi.mocked(auth.useSelloraAuth).mockReturnValue({
      role: "AreaManager",
      isAuthenticated: true,
      isLoading: false,
      roles: ["AreaManager"],
      companyId: "comp-1",
      accessToken: "token",
      username: "manager",
      logout: vi.fn(),
    });

    render(
      <ExportButtons
        reportType="sales-breakdown"
        reportFilters={{ from: "2026-10-01", to: "2026-10-14" }}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByRole("button", { name: /export report as csv/i })).toBeInTheDocument();
  });

  it("renders only CSV on audit page for CompanyAdmin and sends audit filters", () => {
    render(
      <ExportButtons
        reportType="audit-extract"
        auditFilters={{
          orderReference: "ORD-99",
          eventType: "OrderPlaced",
          from: "2026-10-01",
          to: "2026-10-14",
        }}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByRole("button", { name: /export report as csv/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /export report as pdf/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /export report as csv/i }));

    expect(runExportMock).toHaveBeenCalledWith({
      reportType: "audit-extract",
      format: "csv",
      filters: {
        orderReference: "ORD-99",
        eventType: "OrderPlaced",
        occurredFrom: "2026-10-01T00:00:00+05:30",
        occurredTo: "2026-10-14T23:59:59+05:30",
      },
    });
  });

  it("is hidden completely on audit page for non-CompanyAdmin role", () => {
    vi.mocked(auth.useSelloraAuth).mockReturnValue({
      role: "AreaManager",
      isAuthenticated: true,
      isLoading: false,
      roles: ["AreaManager"],
      companyId: "comp-1",
      accessToken: "token",
      username: "manager",
      logout: vi.fn(),
    });

    const { container } = render(
      <ExportButtons
        reportType="audit-extract"
        auditFilters={{ from: "2026-10-01", to: "2026-10-14" }}
      />,
      { wrapper: createWrapper() },
    );

    expect(container.firstChild).toBeNull();
  });

  it("disables buttons when disabled prop is true", () => {
    render(
      <ExportButtons
        reportType="sales-breakdown"
        reportFilters={{ from: "2026-10-14", to: "2026-10-01" }}
        disabled={true}
      />,
      { wrapper: createWrapper() },
    );

    const csvButton = screen.getByRole("button", { name: /export report as csv/i });
    expect(csvButton).toBeDisabled();
  });

  it("displays in-flight phase text during export", () => {
    vi.mocked(hooks.useRunExport).mockReturnValue({
      runExport: runExportMock,
      phase: "Running",
      isPending: true,
    });

    render(
      <ExportButtons
        reportType="sales-breakdown"
        reportFilters={{ from: "2026-10-01", to: "2026-10-14" }}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText("Generating…")).toBeInTheDocument();
  });
});
