import { apiFetch } from "@/api/client";
import { ApiError, type AreaManager, type ProblemDetails, type Province } from "./types";

/** Unwrap a fetch response into T, or throw ApiError with the server's ProblemDetails. */
async function unwrap<T>(response: Response): Promise<T> {
  if (response.ok) {
    return (await response.json()) as T;
  }
  let problem: ProblemDetails = {};
  try {
    problem = (await response.json()) as ProblemDetails;
  } catch {
    // Non-JSON error body — leave problem empty and let ApiError fall back to the HTTP status.
  }
  throw new ApiError(response.status, problem);
}

export function fetchProvinces(): Promise<Province[]> {
  return apiFetch("/api/provinces").then(unwrap<Province[]>);
}

export function fetchAreaManagers(): Promise<AreaManager[]> {
  return apiFetch("/api/area-managers").then(unwrap<AreaManager[]>);
}

export interface AssignmentResult {
  assignmentId: string;
  provinceId: string;
  areaManagerId: string;
  startsAt: string;
}

export function assignAreaManager(
  provinceId: string,
  areaManagerId: string,
): Promise<AssignmentResult> {
  return apiFetch(`/api/provinces/${provinceId}/area-manager`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ areaManagerId }),
  }).then(unwrap<AssignmentResult>);
}
