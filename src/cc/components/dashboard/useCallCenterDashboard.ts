// Data facade for the call-center dashboard (`/cc/dashboard`) — remaining-scope
// plan Phase E3 (`docs/3CX-FE-Development-Plan-Remaining-Scope.md`).
//
// Pattern follows `useDashboardLayouts`
// (src/core/components/custom-dashboard/persistence/useDashboardLayouts.ts):
// behind this facade sits either the real BFF endpoint
// (`callCenterDashboardApi`) or the static fixture under `VITE_MOCK_API`,
// selected by DEV_CONFIG.MOCK_API. The page's code is identical either way.
//
// The RTK Query hook is always *called* (hook order must stay stable) but
// `skip`ped in mock mode. Every payload — fixture or API — passes through
// `extractDashboardSnapshot`, because a resolved response can still carry a
// truthy-but-unusable payload (contract §5: `normalizeToApiResponse` coerces
// absent `data` to `[]` and `Boolean([]) === true`).
//
// The contract (`docs/CC-Dashboard-KPI-Contract.md`) is DRAFT v0.1 — in mock
// mode this hook is the demo surface until the BFF endpoint lands.
import { useMemo } from "react";
import { DEV_CONFIG } from "@/core/utils/constants";
import { useReadCallCenterDashboardQuery } from "@/cc/store/api/callCenterDashboardApi";
import {
  extractDashboardSnapshot,
  formatDashboardPeriod,
  isSnapshotEmpty,
  type CallCenterDashboardSnapshot,
} from "@/cc/types/callCenterDashboard";
import fixture from "@/cc/mocks/callCenterDashboard.json";

/** Coarse UI state derived by {@link useCallCenterDashboard}. */
export type CallCenterDashboardStatus =
  | "loading"
  | "ready"
  | "empty"
  | "invalid"
  | "error";

export interface UseCallCenterDashboardResult {
  /** Valid snapshot when status is "ready" or "empty"; null otherwise. */
  snapshot: CallCenterDashboardSnapshot | null;
  status: CallCenterDashboardStatus;
  /** Background refetch in flight (non-mock mode only). */
  isFetching: boolean;
  /** True while running against the VITE_MOCK_API fixture — drives the demo hint. */
  isMock: boolean;
  /** Re-run the request (no-op that resolves immediately in mock mode). */
  refetch: () => void;
}

/**
 * Loads the dashboard KPI snapshot for `period` (`YYYY-MM`, default: current
 * month). Discriminates the four non-happy outcomes the UI renders distinctly
 * (loading / empty-but-valid / resolved-but-malformed / failed), so the page
 * never has to inspect the raw envelope.
 */
export function useCallCenterDashboard(
  period?: string
): UseCallCenterDashboardResult {
  const isMock = DEV_CONFIG.MOCK_API;

  const { data: response, isLoading, isFetching, isError, refetch } =
    useReadCallCenterDashboardQuery(
      { period: period ?? formatDashboardPeriod(new Date()) },
      { skip: isMock }
    );

  // The fixture is the contract §10 canonical vector — guarded like the real
  // payload so a malformed fixture fails loudly in dev instead of poisoning
  // the demo with a cast.
  const mockSnapshot = useMemo(
    () => extractDashboardSnapshot({ data: fixture }),
    []
  );

  return useMemo<UseCallCenterDashboardResult>(() => {
    if (isMock) {
      return {
        snapshot: mockSnapshot,
        status: mockSnapshot === null ? "invalid" : "ready",
        isFetching: false,
        isMock: true,
        refetch: () => undefined,
      };
    }

    const snapshot = response === undefined ? null : extractDashboardSnapshot(response);
    const status: CallCenterDashboardStatus = isLoading
      ? "loading"
      : isError
        ? "error"
        : snapshot === null
          ? "invalid"
          : isSnapshotEmpty(snapshot)
            ? "empty"
            : "ready";

    return {
      snapshot,
      status,
      isFetching,
      isMock: false,
      refetch: () => {
        void refetch();
      },
    };
  }, [isMock, mockSnapshot, response, isLoading, isFetching, isError, refetch]);
}
