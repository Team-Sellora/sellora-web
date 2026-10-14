// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuditVerifyPanel } from "./AuditVerifyPanel";
import * as hooks from "../hooks";
import * as auth from "@/auth/useSelloraAuth";
import type { AuditVerificationResult } from "../types";

vi.mock("@/auth/useSelloraAuth", () => ({
  useSelloraAuth: vi.fn(),
}));

vi.mock("../hooks", () => ({
  useVerifyAudit: vi.fn(),
}));

describe("AuditVerifyPanel", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const renderComponent = (props: { onSelectEntry?: (id: string) => void } = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <AuditVerifyPanel {...props} />
      </QueryClientProvider>,
    );
  };

  it("is hidden for Area Manager role", () => {
    vi.mocked(auth.useSelloraAuth).mockReturnValue({
      role: "AreaManager",
      roles: ["AreaManager"],
      companyId: "c1",
      accessToken: "t1",
      username: "area_mgr",
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
    });

    vi.mocked(hooks.useVerifyAudit).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      data: undefined,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof hooks.useVerifyAudit>);

    renderComponent();
    expect(screen.queryByTestId("audit-verify-panel")).toBeNull();
  });

  it("renders verify button for Company Admin", () => {
    vi.mocked(auth.useSelloraAuth).mockReturnValue({
      role: "CompanyAdmin",
      roles: ["CompanyAdmin"],
      companyId: "c1",
      accessToken: "t1",
      username: "admin",
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
    });

    const mutate = vi.fn();
    vi.mocked(hooks.useVerifyAudit).mockReturnValue({
      mutate,
      isPending: false,
      data: undefined,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof hooks.useVerifyAudit>);

    renderComponent();
    const button = screen.getByTestId("verify-integrity-button");
    expect(button).toBeDefined();
    fireEvent.click(button);
    expect(mutate).toHaveBeenCalledTimes(1);
  });

  it("displays green success banner with entries checked when chain is verified", () => {
    vi.mocked(auth.useSelloraAuth).mockReturnValue({
      role: "CompanyAdmin",
      roles: ["CompanyAdmin"],
      companyId: "c1",
      accessToken: "t1",
      username: "admin",
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
    });

    const verifiedResult: AuditVerificationResult = {
      verified: true,
      entriesChecked: 1420,
      firstBroken: null,
    };

    vi.mocked(hooks.useVerifyAudit).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      data: verifiedResult,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof hooks.useVerifyAudit>);

    renderComponent();
    expect(screen.getByTestId("verify-success-banner")).toBeDefined();
    expect(screen.getByText(/All 1,420 sequential entries/)).toBeDefined();
    expect(screen.queryByTestId("verify-failure-banner")).toBeNull();
  });

  it("displays red banner naming first broken entry, plain reason, and link to entry", () => {
    vi.mocked(auth.useSelloraAuth).mockReturnValue({
      role: "CompanyAdmin",
      roles: ["CompanyAdmin"],
      companyId: "c1",
      accessToken: "t1",
      username: "admin",
      isLoading: false,
      isAuthenticated: true,
      logout: vi.fn(),
    });

    const brokenResult: AuditVerificationResult = {
      verified: false,
      entriesChecked: 45,
      firstBroken: {
        auditEntryId: "entry-broken-99",
        chainPosition: 46,
        eventType: "OrderPlaced",
        reason: "HashMismatch",
      },
    };

    vi.mocked(hooks.useVerifyAudit).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      data: brokenResult,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof hooks.useVerifyAudit>);

    const onSelectEntry = vi.fn();
    renderComponent({ onSelectEntry });

    expect(screen.getByTestId("verify-failure-banner")).toBeDefined();
    expect(screen.getAllByText(/#46/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Order Placed/)).toBeDefined();
    expect(
      screen.getByText(/Hash mismatch — the entry's recorded hash does not match its contents/),
    ).toBeDefined();

    const link = screen.getByTestId("inspect-broken-entry-link");
    expect(link).toBeDefined();
    fireEvent.click(link);
    expect(onSelectEntry).toHaveBeenCalledWith("entry-broken-99");
  });
});
