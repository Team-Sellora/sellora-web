export class ReportsApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail?: string | undefined,
    public readonly title?: string | undefined,
  ) {
    super(detail ?? title ?? `Report request failed with status ${status}`);
    this.name = "ReportsApiError";
  }
}
