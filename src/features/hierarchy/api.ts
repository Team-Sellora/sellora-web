import { apiFetch } from "@/api/client";

export type Status = "Active" | "Inactive";
export type Page<T> = { items: T[]; totalCount: number; page: number; pageSize: number };
export type Province = { provinceId: string; name: string; code: string; status: Status };
export type Agency = {
  agencyId: string;
  provinceId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  status: Status;
  createdAt: string;
};
export type Territory = {
  territoryId: string;
  provinceId: string;
  code: string;
  name: string;
  geographicDescription?: string | null;
  status: Status;
  createdAt: string;
};

export type TerritoryAgencyAssignment = {
  assignmentId: string;
  territoryId: string;
  agencyId: string;
  startsAt: string;
};

export type Shop = {
  shopId: string;
  territoryId: string;
  name: string;
  ownerName?: string | null;
  ownerEmail?: string | null;
  ownerPhone?: string | null;
  address: string;
  latitude: number;
  longitude: number;
  creditLimit: number;
  status: Status;
  createdAt: string;
  updatedAt?: string | null;
};

export type ShopInput = {
  territoryId: string;
  name: string;
  ownerName: string;
  ownerIdentitySub: string;
  ownerEmail: string;
  ownerPhone: string;
  address: string;
  latitude: number;
  longitude: number;
  creditLimit: number;
};

type HierarchyResponse = {
  provinces: Array<{
    agencies: Array<{
      territories: Array<{
        territoryId: string;
        code: string;
        name: string;
      }>;
    }>;
  }>;
};

export class ApiProblem extends Error {
  constructor(
    public readonly status: number,
    public readonly detail?: string,
    public readonly title?: string,
  ) {
    super(detail || title || `Request failed (${status})`);
  }
}
async function unwrap<T>(response: Response): Promise<T> {
  if (response.ok) return (await response.json()) as T;
  let body: { detail?: string; title?: string } = {};
  try {
    body = (await response.json()) as typeof body;
  } catch {
    /* ignored */
  }
  throw new ApiProblem(response.status, body.detail, body.title);
}
export const fetchProvinces = () => apiFetch("/api/provinces").then(unwrap<Province[]>);

export const fetchAgencies = () =>
  apiFetch("/api/agencies?page=1&pageSize=100").then(unwrap<Page<Agency>>);

export const fetchTerritories = () =>
  apiFetch("/api/territories?page=1&pageSize=100").then(unwrap<Page<Territory>>);

export const fetchUnassignedTerritories = () =>
  apiFetch("/api/territories?assigned=false&page=1&pageSize=100").then(unwrap<Page<Territory>>);

export const assignTerritoryToAgency = (territoryId: string, agencyId: string) =>
  apiFetch(`/api/territories/${territoryId}/agency`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agencyId }),
  }).then(unwrap<TerritoryAgencyAssignment>);

export const createAgency = (input: {
  provinceId: string;
  operatorId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}) =>
  apiFetch("/api/agencies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).then(unwrap<Agency>);

export const createTerritory = (input: {
  provinceId: string;
  code: string;
  name: string;
  geographicDescription?: string;
}) =>
  apiFetch("/api/territories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).then(unwrap<Territory>);
export const fetchShops = (filters: {
  territoryId?: string;
  status?: Status;
  page?: number;
  pageSize?: number;
}) => {
  const query = new URLSearchParams({
    status: filters.status ?? "Active",
    page: String(filters.page ?? 1),
    pageSize: String(filters.pageSize ?? 25),
  });

  if (filters.territoryId) query.set("territoryId", filters.territoryId);

  return apiFetch(`/api/shops?${query}`).then(unwrap<Page<Shop>>);
};

export const createShop = (input: ShopInput) =>
  apiFetch("/api/shops", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).then(unwrap<Shop>);

export const fetchOperatorTerritories = async () => {
  const hierarchy = await apiFetch("/api/hierarchy").then(unwrap<HierarchyResponse>);

  return hierarchy.provinces.flatMap((province) =>
    province.agencies.flatMap((agency) => agency.territories),
  );
};
