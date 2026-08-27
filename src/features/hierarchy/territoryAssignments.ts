import type { Agency } from "./api";

export function agenciesForProvince(agencies: readonly Agency[], provinceId: string) {
  return agencies.filter((agency) => agency.provinceId === provinceId);
}
