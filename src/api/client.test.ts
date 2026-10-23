import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

vi.mock("@/config/env", () => ({
  env: {
    gatewayBaseUrl: "https://organization.example",
    catalogGatewayBaseUrl: "https://catalog.example",
    inventoryGatewayBaseUrl: "https://inventory.example",
  },
}));

vi.mock("./tokenStore", () => ({ getAccessToken: () => "access-token" }));

import { inventoryApiFetch, setUnauthorizedHandler } from "./client";

describe("inventory gateway authentication failures", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    setUnauthorizedHandler(vi.fn());
  });

  it("keeps the user on the inventory page when its gateway returns 401", async () => {
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    fetchMock.mockResolvedValue(new Response(null, { status: 401 }));

    const response = await inventoryApiFetch("/api/stock");

    expect(response.status).toBe(401);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});
