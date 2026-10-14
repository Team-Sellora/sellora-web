export class ExportApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail?: string | undefined,
    public readonly title?: string | undefined,
  ) {
    super(detail ?? title ?? `Export request failed with status ${status}`);
    this.name = "ExportApiError";
  }
}

export function formatExportErrorMessage(error: unknown): string {
  if (error instanceof ExportApiError) {
    if (error.status === 400) {
      return error.detail ?? "Invalid export parameters or date range.";
    }
    if (error.status === 403) {
      return error.detail ?? "This report type cannot be exported with your role.";
    }
    if (error.status === 404) {
      return "Export not found.";
    }
    if (error.status === 409) {
      return "Export is still generating. Please try again in a moment.";
    }
    if (error.status === 410) {
      return "This export has expired and its file was removed.";
    }
    if (error.status === 503) {
      return "Organization service is unavailable, try again later";
    }
    if (error.detail) {
      return error.detail;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred while processing the export.";
}
