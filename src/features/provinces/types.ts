// Mirrors the ProvinceSummaryResponse record from CSP-64.
export interface CurrentManager {
  staffProfileId: string;
  displayName: string;
  email: string | null;
}

export interface Province {
  provinceId: string;
  code: string;
  name: string;
  status: string;
  createdAt: string;
  currentManager: CurrentManager | null;
  agencyCount: number;
  shopCount: number;
}

// Mirrors the AreaManagerSummary record from the CSP-65 backend addition.
export interface AreaManager {
  staffProfileId: string;
  displayName: string;
  email: string | null;
  status: string;
}

// RFC 7807 Problem Details, which ASP.NET returns on every 4xx from our
// controllers. Only the fields we surface in the UI are typed.
export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
}

/**
 * Thrown by the api layer when a request returns a non-2xx status.
 * Carries the parsed ProblemDetails so components can render the
 * server-supplied `detail` message inline next to the offending field.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly problem: ProblemDetails,
  ) {
    super(problem.detail ?? problem.title ?? `HTTP ${status}`);
    this.name = "ApiError";
  }
}