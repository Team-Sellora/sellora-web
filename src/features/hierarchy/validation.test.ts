import { describe, expect, it } from "vitest";
import { validateAgency, validateTerritory } from "./validation";
import { validateShop } from "./validation";

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

describe("shop registration validation", () => {
  const validShop = {
    territoryId: "territory-1",
    name: "Lake View Stores",
    ownerIdentitySub: "shop-owner-1",
    address: "18 Test Road",
    latitude: "6.927079",
    longitude: "79.861244",
    creditLimit: "10000",
  };

  it("requires valid GPS coordinates", () => {
    expect(
      validateShop({
        ...validShop,
        latitude: "",
        longitude: "0",
      }),
    ).toEqual({
      latitude: "Latitude is required.",
      longitude: "Longitude must be within Sri Lanka (79.4 to 81.9).",
    });
  });

  it("rejects a non-positive credit limit", () => {
    expect(
      validateShop({
        ...validShop,
        creditLimit: "0",
      }),
    ).toEqual({
      creditLimit: "Credit limit must be greater than zero.",
    });
  });
});
