// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { MyExportsPanel } from "./MyExportsPanel";
import * as auth from "@/auth/useSelloraAuth";
import * as exportsHook from "../useMyExports";
import * as download from "../download";
import { ExportApiError } from "../apiError";
import type { ExportStatusResponse } from "../types";

vi.mock("@/auth/useSelloraAuth", () => ({
  useSelloraAuth: vi.fn(),
}));

vi.mock("../useMyExports", () => ({
  MY_EXPORTS_QUERY_KEY: ["myExports"],
  useMyExports: vi.fn(),
}));

vi.mock("../download", () => ({
  downloadExportFile: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("MyExportsPanel component", () => {
  beforeEach(() => {
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

  it("renders empty state when no exports exist and toggle is expanded", () => {
    vi.mocked(exportsHook.useMyExports).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof exportsHook.useMyExports>);

    render(<MyExportsPanel />, { wrapper: createWrapper() });

    // Open panel
    fireEvent.click(screen.getByRole("button", { name: /show/i }));

    expect(screen.getByText("No exports yet.")).toBeInTheDocument();
  });

  it("renders each status and restricts download button to ready unexpired items", () => {
    const mockList: ExportStatusResponse[] = [
      {
        exportId: "exp-ready",
        reportType: "sales-summary",
        format: "csv",
        status: "Ready",
        createdAt: "2026-10-14T05:00:00Z",
        expiresAt: "2099-10-15T05:00:00Z",
      },
      {
        exportId: "exp-running",
        reportType: "sales-breakdown",
        format: "pdf",
        status: "Running",
        createdAt: "2026-10-14T05:00:00Z",
      },
      {
        exportId: "exp-queued",
        reportType: "audit-extract",
        format: "csv",
        status: "Queued",
        createdAt: "2026-10-14T05:00:00Z",
      },
      {
        exportId: "exp-failed",
        reportType: "sales-summary",
        format: "csv",
        status: "Failed",
        createdAt: "2026-10-14T05:00:00Z",
        error: "Database projection timeout",
      },
      {
        exportId: "exp-expired",
        reportType: "sales-summary",
        format: "csv",
        status: "Expired",
        createdAt: "2026-10-14T05:00:00Z",
      },
    ];

    vi.mocked(exportsHook.useMyExports).mockReturnValue({
      data: mockList,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof exportsHook.useMyExports>);

    render(<MyExportsPanel />, { wrapper: createWrapper() });

    fireEvent.click(screen.getByRole("button", { name: /show/i }));

    expect(screen.getByText("Ready")).toBeInTheDocument();
    expect(screen.getByText("Running")).toBeInTheDocument();
    expect(screen.getByText("Queued")).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();
    expect(screen.getByText("Database projection timeout")).toBeInTheDocument();
    expect(screen.getByText("Expired")).toBeInTheDocument();

    // Only 1 download button should exist (for exp-ready)
    const downloadButtons = screen.getAllByRole("button", { name: /download/i });
    expect(downloadButtons).toHaveLength(1);
  });

  it("handles 410 expired download by showing toast message", async () => {
    const mockList: ExportStatusResponse[] = [
      {
        exportId: "exp-ready-410",
        reportType: "sales-summary",
        format: "csv",
        status: "Ready",
        createdAt: "2026-10-14T05:00:00Z",
        expiresAt: "2099-10-15T05:00:00Z",
      },
    ];

    vi.mocked(exportsHook.useMyExports).mockReturnValue({
      data: mockList,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof exportsHook.useMyExports>);

    vi.mocked(download.downloadExportFile).mockRejectedValue(
      new ExportApiError(410, "Export expired"),
    );

    render(<MyExportsPanel />, { wrapper: createWrapper() });

    fireEvent.click(screen.getByRole("button", { name: /show/i }));

    const downloadButton = screen.getByRole("button", { name: /download/i });
    fireEvent.click(downloadButton);

    await vi.waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("This export has expired");
    });
  });

  it("is hidden for roles without reporting access", () => {
    vi.mocked(auth.useSelloraAuth).mockReturnValue({
      role: "SalesRep",
      isAuthenticated: true,
      isLoading: false,
      roles: ["SalesRep"],
      companyId: "comp-1",
      accessToken: "token",
      username: "rep",
      logout: vi.fn(),
    });

    const { container } = render(<MyExportsPanel />, { wrapper: createWrapper() });
    expect(container.firstChild).toBeNull();
  });
});
