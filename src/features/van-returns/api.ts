import { orderApiFetch } from "@/api/client";
import {
  VanReturnApiError,
  type CountLineInput,
  type DeclareLineInput,
  type PagedVanReturns,
  type VanReturn,
  type VanReturnApiErrorBody,
} from "./types";

async function unwrap<T>(response: Response): Promise<T> {
  if (response.ok) {
    return (await response.json()) as T;
  }

  let body: VanReturnApiErrorBody = {};
  try {
    body = (await response.json()) as VanReturnApiErrorBody;
  } catch {
    // Keep the status when there is no JSON body.
  }

  throw new VanReturnApiError(response.status, body);
}

/** US-E4-6: the rep declares unsold van stock. Only positive quantities are sent. */
export function declareVanReturn(lines: DeclareLineInput[]): Promise<VanReturn> {
  return orderApiFetch("/api/van-returns", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lines: lines.filter((line) => line.quantity > 0) }),
  }).then(unwrap<VanReturn>);
}

/** US-E4-6: the agency operator records what was counted for every line. */
export function acceptVanReturn(
  vanReturnId: string,
  lines: CountLineInput[],
  note?: string,
): Promise<VanReturn> {
  return orderApiFetch(`/api/van-returns/${encodeURIComponent(vanReturnId)}/acceptance`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lines, note: note?.trim() || undefined }),
  }).then(unwrap<VanReturn>);
}

export function fetchVanReturns(query: {
  page: number;
  pageSize: number;
  status?: string | undefined;
}): Promise<PagedVanReturns> {
  const parameters = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
  });
  if (query.status) {
    parameters.set("status", query.status);
  }
  return orderApiFetch(`/api/van-returns?${parameters.toString()}`).then(unwrap<PagedVanReturns>);
}

export function fetchVanReturn(vanReturnId: string): Promise<VanReturn> {
  return orderApiFetch(`/api/van-returns/${encodeURIComponent(vanReturnId)}`).then(
    unwrap<VanReturn>,
  );
}
