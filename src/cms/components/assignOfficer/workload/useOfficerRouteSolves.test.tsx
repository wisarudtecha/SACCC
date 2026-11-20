// The `enabled` gate of the assignment picker's on-demand route solves.
//
// The regression this pins down: the picker solved a driving route per officer row for
// EVERY tenant, including one with no GIS add-on. The column is now hidden for them, but
// hiding a column is presentation - the guard that actually stops the provider call has
// to live on the hook, or the next surface (or a stale callback) spends a request the
// tenant never bought.
//
// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Unit } from "@/cms/types/dispatch";
import {
  useOfficerRouteSolves,
  type UseOfficerRouteSolvesResult,
} from "./useOfficerRouteSolves";

const { solveSpy } = vi.hoisted(() => ({ solveSpy: vi.fn() }));

// The provider call itself. Mocked so "did anything reach the routing provider?" is a
// direct assertion instead of an inference from rendered output.
vi.mock("@/cms/components/case/createCase/map/services/routeService", () => ({
  routeService: {
    solve: (...args: unknown[]) => solveSpy(...args),
  },
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const NOW = Date.now();

const OFFICER = {
  unitId: "unit-1",
  locLat: "13.7563",
  locLon: "100.5018",
  locLastUpdateTime: new Date(NOW).toISOString(),
} as unknown as Unit;

const CASE_LOCATION = { latitude: 13.75, longitude: 100.52 };

let container: HTMLDivElement;
let root: Root;
let latest: UseOfficerRouteSolvesResult | null = null;

function Harness({ enabled }: { enabled: boolean }) {
  latest = useOfficerRouteSolves({
    officers: [OFFICER],
    caseLocation: CASE_LOCATION,
    enabled,
  });
  return null;
}

const render = async (enabled: boolean) => {
  await act(async () => {
    root.render(<Harness enabled={enabled} />);
  });
};

beforeEach(() => {
  solveSpy.mockReset();
  solveSpy.mockResolvedValue(null);
  latest = null;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });
  container.remove();
});

describe("useOfficerRouteSolves — entitlement gate", () => {
  it("refuses to solve and never reaches the provider when disabled", async () => {
    await render(false);

    expect(latest?.canSolve(OFFICER.unitId)).toBe(false);

    await act(async () => {
      latest?.solve(OFFICER.unitId);
    });

    expect(solveSpy).not.toHaveBeenCalled();
  });

  it("solves normally when enabled and the case has a mappable location", async () => {
    await render(true);

    expect(latest?.canSolve(OFFICER.unitId)).toBe(true);

    await act(async () => {
      latest?.solve(OFFICER.unitId);
    });

    expect(solveSpy).toHaveBeenCalledTimes(1);
    expect(solveSpy).toHaveBeenCalledWith(
      { latitude: 13.7563, longitude: 100.5018 },
      CASE_LOCATION
    );
  });
});
