export class AuditApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail?: string,
    public readonly title?: string,
  ) {
    super(detail ?? title ?? `Audit request failed with status ${status}`);
    this.name = "AuditApiError";
  }
}
