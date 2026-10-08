// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DeliveryStatusBadge } from "./DeliveryStatusBadge";
import type { DeliveryStatus } from "../types";

describe("DeliveryStatusBadge", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders distinct badge for Assigned", () => {
    render(<DeliveryStatusBadge status="Assigned" />);
    const badge = screen.getByText("Assigned");
    expect(badge).toBeTruthy();
    expect(badge.className).toContain("bg-blue-100");
  });

  it("renders distinct badge for Failed", () => {
    render(<DeliveryStatusBadge status="Failed" />);
    const badge = screen.getByText("Failed");
    expect(badge).toBeTruthy();
    expect(badge.className).toContain("bg-red-100");
  });
});
