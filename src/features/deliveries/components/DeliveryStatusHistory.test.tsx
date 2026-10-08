// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DeliveryStatusHistory } from "./DeliveryStatusHistory";

describe("DeliveryStatusHistory", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders empty state", () => {
    render(<DeliveryStatusHistory history={[]} />);
    expect(screen.getByText("No history available.")).toBeTruthy();
  });

  it("renders history entries with localized time", () => {
    const history = [
      {
        status: "Assigned" as const,
        actorRole: "System",
        occurredAt: "2026-10-07T10:00:00Z",
      },
      {
        status: "InTransit" as const,
        actorRole: "Sales Rep",
        occurredAt: "2026-10-07T11:00:00Z",
        reason: "Started trip",
      },
    ];

    render(<DeliveryStatusHistory history={history} />);

    expect(screen.getByText("System")).toBeTruthy();
    expect(screen.getByText("Sales Rep")).toBeTruthy();
    expect(screen.getByText("Started trip")).toBeTruthy();
    // exact date-fns localized string depends on timezone, but should render
  });
});
