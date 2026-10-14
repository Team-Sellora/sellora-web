import { auditApiBlob } from "@/api/client";
import { ExportApiError } from "./apiError";

/** Parses the file name from a Content-Disposition header. */
export function parseContentDispositionFilename(header: string | null | undefined): string | null {
  if (!header) return null;

  // RFC 5987 / RFC 6266 filename* takes precedence
  const starMatch = /filename\*\s*=\s*([^;]+)/i.exec(header);
  if (starMatch?.[1]) {
    const raw = starMatch[1].trim().replace(/^["']|["']$/g, "");
    const parts = raw.split("''");
    const encoded = parts.length > 1 ? parts.slice(1).join("''") : parts[0]!;
    try {
      const decoded = decodeURIComponent(encoded).trim();
      if (decoded) return decoded;
    } catch {
      if (encoded.trim()) return encoded.trim();
    }
  }

  // Standard filename parameter (quoted or unquoted)
  const plainMatch = /filename\s*=\s*(?:"([^"]+)"|([^;\s]+))/i.exec(header);
  if (plainMatch) {
    const name = plainMatch[1] ?? plainMatch[2];
    if (name?.trim()) return name.trim();
  }

  return null;
}

/** Resolves a safe file name with format fallback. */
export function getSafeExportFileName(
  disposition: string | null | undefined,
  fallbackFormat: "csv" | "pdf" | string = "csv",
  defaultBaseName = "sellora-export",
): string {
  const parsed = parseContentDispositionFilename(disposition);
  if (parsed) {
    const sanitized = parsed.replace(/[\\/:*?"<>|]/g, "_").trim();
    if (sanitized) return sanitized;
  }
  const ext = fallbackFormat.toLowerCase().includes("pdf") ? "pdf" : "csv";
  return `${defaultBaseName}.${ext}`;
}

/** Saves a Blob to disk using a temporary object URL and revokes it. */
export function triggerBlobDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Authenticated file download for ready exports. */
export async function downloadExportFile(
  exportId: string,
  options?: { fallbackFormat?: "csv" | "pdf" | undefined; defaultBaseName?: string | undefined },
): Promise<{ fileName: string }> {
  try {
    const { blob, headers } = await auditApiBlob(
      `/api/reports/export/${encodeURIComponent(exportId)}/file`,
    );
    const disposition = headers.get("content-disposition");
    const fileName = getSafeExportFileName(
      disposition,
      options?.fallbackFormat,
      options?.defaultBaseName,
    );
    triggerBlobDownload(blob, fileName);
    return { fileName };
  } catch (err) {
    if (err instanceof ExportApiError) {
      throw err;
    }
    const status = (err as { status?: number }).status ?? 500;
    const detail =
      (err as { detail?: string }).detail ?? (err instanceof Error ? err.message : undefined);
    const title = (err as { title?: string }).title;
    throw new ExportApiError(status, detail, title);
  }
}
