import { describe, expect, it } from "vitest";
import type { Agency } from "./api";
import { agenciesForProvince } from "./territoryAssignments";

const agency = (agencyId: string, provinceId: string): Agency => ({
  agencyId,
  provinceId,
  name: agencyId,
  status: "Active",
  createdAt: "2026-01-01T00:00:00Z",
});

describe("agenciesForProvince", () => {
  it("only offers agencies belonging to the territory province", () => {
    const agencies = [agency("western-agency", "western"), agency("southern-agency", "southern")];

    expect(agenciesForProvince(agencies, "western")).toEqual([agencies[0]]);
  });
});
