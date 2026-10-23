// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  downloadExportFile,
  getSafeExportFileName,
  parseContentDispositionFilename,
  triggerBlobDownload,
} from "./download";
import * as client from "@/api/client";

vi.mock("@/api/client", () => ({
  auditApiBlob: vi.fn(),
}));

describe("parseContentDispositionFilename", () => {
  it("extracts quoted filename", () => {
    expect(parseContentDispositionFilename('attachment; filename="sales-summary-2026.csv"')).toBe(
      "sales-summary-2026.csv",
    );
  });

  it("extracts unquoted filename", () => {
    expect(parseContentDispositionFilename("attachment; filename=sales-breakdown.csv")).toBe(
      "sales-breakdown.csv",
    );
  });

  it("extracts and decodes RFC 5987 / RFC 6266 filename* with priority", () => {
    expect(
      parseContentDispositionFilename(
        "attachment; filename=\"fallback.csv\"; filename*=UTF-8''sales%20report%20colombo.csv",
      ),
    ).toBe("sales report colombo.csv");
  });

  it("returns null when header is null or missing filename", () => {
    expect(parseContentDispositionFilename(null)).toBeNull();
    expect(parseContentDispositionFilename(undefined)).toBeNull();
    expect(parseContentDispositionFilename("inline")).toBeNull();
  });
});

describe("getSafeExportFileName", () => {
  it("sanitizes dangerous path characters", () => {
    const filename = getSafeExportFileName('attachment; filename="../secret/report.csv"');
    expect(filename).toBe(".._secret_report.csv");
  });

  it("falls back to safe default with csv extension", () => {
    expect(getSafeExportFileName(null, "csv")).toBe("sellora-export.csv");
  });

  it("falls back to safe default with pdf extension", () => {
    expect(getSafeExportFileName(null, "pdf")).toBe("sellora-export.pdf");
  });
});

describe("triggerBlobDownload", () => {
  let createObjectURLSpy: ReturnType<typeof vi.fn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    createObjectURLSpy = vi.fn().mockReturnValue("blob:mock-url-123");
    revokeObjectURLSpy = vi.fn();
    globalThis.URL.createObjectURL = createObjectURLSpy as unknown as typeof URL.createObjectURL;
    globalThis.URL.revokeObjectURL = revokeObjectURLSpy as unknown as typeof URL.revokeObjectURL;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates an object URL, clicks anchor and always revokes the URL", () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const blob = new Blob(["test-data"], { type: "text/csv" });

    triggerBlobDownload(blob, "report.csv");

    expect(createObjectURLSpy).toHaveBeenCalledWith(blob);
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:mock-url-123");
  });
});

describe("downloadExportFile", () => {
  beforeEach(() => {
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    globalThis.URL.createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("downloads file and extracts filename from header", async () => {
    const headers = new Headers();
    headers.set("content-disposition", 'attachment; filename="export-001.csv"');
    const blob = new Blob(["content"], { type: "text/csv" });

    vi.mocked(client.auditApiBlob).mockResolvedValue({
      blob,
      headers,
      status: 200,
    });

    const result = await downloadExportFile("exp-123");
    expect(result.fileName).toBe("export-001.csv");
  });

  it("propagates error with status code", async () => {
    const error = new Error("Export expired");
    (error as Error & { status: number }).status = 410;
    vi.mocked(client.auditApiBlob).mockRejectedValue(error);

    await expect(downloadExportFile("exp-expired")).rejects.toMatchObject({
      status: 410,
    });
  });
});
