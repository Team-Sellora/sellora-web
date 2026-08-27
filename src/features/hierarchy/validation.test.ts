import { describe, expect, it } from "vitest";
import { validateAgency, validateTerritory } from "./validation";

describe("agency registration validation", () => {
  it("requires the province, agency operator, and agency name", () => {
    expect(validateAgency({ provinceId: "", operatorId: "", name: "  " })).toEqual({
      provinceId: "Select a province.",
      operatorId: "Agency operator ID is required.",
      name: "Agency name is required.",
    });
  });
});

describe("territory registration validation", () => {
  it("rejects a duplicate code regardless of case", () => {
    expect(
      validateTerritory({ provinceId: "p-1", code: "wp-t-01", name: "Colombo" }, ["WP-T-01"]),
    ).toEqual({ code: "This territory code already exists." });
  });
});
