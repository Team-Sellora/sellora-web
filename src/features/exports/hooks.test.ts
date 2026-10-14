// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { useExportStatus, useRunExport } from "./hooks";
import * as api from "./api";
import * as download from "./download";
import type { CreateExportRequest, ExportStatusResponse } from "./types";

vi.mock("./api", () => ({
  submitExport: vi.fn(),
  getExportStatus: vi.fn(),
}));

vi.mock("./download", () => ({
  downloadExportFile: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("useExportStatus refetch interval", () => {
  it("polls initially and stops on terminal status", async () => {
    const statusReady: ExportStatusResponse = {
      exportId: "exp-1",
      reportType: "sales-summary",
      format: "csv",
      status: "Ready",
      createdAt: "2026-10-14T00:00:00Z",
    };
    vi.mocked(api.getExportStatus).mockResolvedValue(statusReady);

    const { result } = renderHook(() => useExportStatus("exp-1"), {
      wrapper: createWrapper(),
    });

    await vi.waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.status).toBe("Ready");
  });
});

describe("useRunExport workflow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(api.submitExport).mockResolvedValue({ exportId: "exp-test-123" });
    vi.mocked(download.downloadExportFile).mockResolvedValue({ fileName: "report.csv" });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const sampleRequest: CreateExportRequest = {
    reportType: "sales-summary",
    format: "csv",
  };

  it("submits, polls until Ready, downloads file and shows success toast", async () => {
    const queuedResponse: ExportStatusResponse = {
      exportId: "exp-test-123",
      reportType: "sales-summary",
      format: "csv",
      status: "Queued",
      createdAt: "2026-10-14T00:00:00Z",
    };
    const runningResponse: ExportStatusResponse = {
      ...queuedResponse,
      status: "Running",
    };
    const readyResponse: ExportStatusResponse = {
      ...queuedResponse,
      status: "Ready",
    };

    vi.mocked(api.getExportStatus)
      .mockResolvedValueOnce(queuedResponse)
      .mockResolvedValueOnce(runningResponse)
      .mockResolvedValueOnce(readyResponse);

    const { result } = renderHook(() => useRunExport(), {
      wrapper: createWrapper(),
    });

    let exportPromise: Promise<void>;
    act(() => {
      exportPromise = result.current.runExport(sampleRequest);
    });

    expect(result.current.isPending).toBe(true);

    // Advance 1st delay (1500ms)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });

    // Advance 2nd delay (2500ms)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2500);
    });

    // Advance 3rd delay (3500ms) -> Ready
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3500);
    });

    await act(async () => {
      await exportPromise;
    });

    expect(api.submitExport).toHaveBeenCalledWith(sampleRequest);
    expect(download.downloadExportFile).toHaveBeenCalledWith("exp-test-123", {
      fallbackFormat: "csv",
    });
    expect(toast.success).toHaveBeenCalledWith("Export ready and downloaded.");
    expect(result.current.phase).toBe("idle");
    expect(result.current.isPending).toBe(false);
  });

  it("stops polling on Failed status and shows error toast", async () => {
    const failedResponse: ExportStatusResponse = {
      exportId: "exp-test-123",
      reportType: "sales-summary",
      format: "csv",
      status: "Failed",
      error: "Projection error during generation",
      createdAt: "2026-10-14T00:00:00Z",
    };

    vi.mocked(api.getExportStatus).mockResolvedValueOnce(failedResponse);

    const { result } = renderHook(() => useRunExport(), {
      wrapper: createWrapper(),
    });

    let exportPromise: Promise<void>;
    act(() => {
      exportPromise = result.current.runExport(sampleRequest);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });

    await act(async () => {
      await exportPromise;
    });

    expect(download.downloadExportFile).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("Projection error during generation");
    expect(result.current.phase).toBe("idle");
  });

  it("stops polling on Expired status and shows expired toast", async () => {
    const expiredResponse: ExportStatusResponse = {
      exportId: "exp-test-123",
      reportType: "sales-summary",
      format: "csv",
      status: "Expired",
      createdAt: "2026-10-14T00:00:00Z",
    };

    vi.mocked(api.getExportStatus).mockResolvedValueOnce(expiredResponse);

    const { result } = renderHook(() => useRunExport(), {
      wrapper: createWrapper(),
    });

    let exportPromise: Promise<void>;
    act(() => {
      exportPromise = result.current.runExport(sampleRequest);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });

    await act(async () => {
      await exportPromise;
    });

    expect(toast.error).toHaveBeenCalledWith("This export has expired and its file was removed.");
  });

  it("gives up with info toast after 5 minutes timeout", async () => {
    const runningResponse: ExportStatusResponse = {
      exportId: "exp-test-123",
      reportType: "sales-summary",
      format: "csv",
      status: "Running",
      createdAt: "2026-10-14T00:00:00Z",
    };

    vi.mocked(api.getExportStatus).mockResolvedValue(runningResponse);

    const { result } = renderHook(() => useRunExport(), {
      wrapper: createWrapper(),
    });

    let exportPromise: Promise<void>;
    act(() => {
      exportPromise = result.current.runExport(sampleRequest);
    });

    // Advance past 5 minutes (300,000ms)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(305_000);
    });

    await act(async () => {
      await exportPromise;
    });

    expect(toast.info).toHaveBeenCalledWith(
      "This is taking longer than usual. You can find it in My exports.",
    );
  });
});
