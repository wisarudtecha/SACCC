// Call-center dashboard KPI endpoints — remaining-scope plan Phase E2
// (`docs/3CX-FE-Development-Plan-Remaining-Scope.md`).
//
// ─────────────────────────────────────────────────────────────────────────────
// DORMANT BY DESIGN — READ BEFORE WIRING THIS TO THE UI
// ─────────────────────────────────────────────────────────────────────────────
// The BFF aggregation endpoint does not exist yet — the full contract is the
// handoff artifact `docs/CC-Dashboard-KPI-Contract.md` (DRAFT v0.1, open
// questions Q1–Q10 pending backend sign-off). Nothing in the UI calls this
// hook today; `/cc/dashboard` still renders the hardcoded shell until plan
// item E3 wires it (behind `VITE_MOCK_API` fixtures first, per the
// contract-first pattern used for the softphone).
//
// 1. The URL path (`/call-center/dashboard`) is the FE's *proposal*, modeled
//    on the `/call-control/…` family (see `callControlApi.ts`). The backend
//    owns actual path + all KPI aggregation math (capability-matrix §9); only
//    the path may change at sign-off — the FE consumer should be unaffected.
//
// 2. NO GQL_MAP ENTRIES ON PURPOSE. The hybrid base query auto-converts every
//    request when `VITE_USE_GRAPHQL === "true"`, and a URL with no entry in
//    `GQL_MAP` (`src/core/utils/gqlMapper.ts`) fails HARD — there is no REST
//    fallback. This endpoint must NOT be called in any GraphQL-enabled
//    environment until the BFF exposes an equivalent and entries are added to
//    a `graphql/callCenterDashboardQueries.ts` file.
//
// 3. Consumers MUST validate the payload's shape via
//    `isCallCenterDashboardSnapshot` / `extractDashboardSnapshot`
//    (`src/cc/types/callCenterDashboard.ts`) — an absent `data` is coerced to
//    `[]` by `normalizeToApiResponse` and `Boolean([]) === true` (contract §5).
//
// When the backend contract lands:
//   - confirm/adjust the URL path and field semantics against the signed-off
//     contract,
//   - add GQL_MAP entries if the BFF provides a GraphQL equivalent,
//   - wire the dashboard page (E3) to this hook, and
//   - remove this DORMANT banner.
// ─────────────────────────────────────────────────────────────────────────────

import { baseApi } from "@/core/store/api/baseApi";
import type { ApiResponse } from "@/cms/types";
import type { CallCenterDashboardSnapshot } from "@/cc/types/callCenterDashboard";

/** Query params for the dashboard aggregate. `period` = `YYYY-MM` (contract §3). */
export interface CallCenterDashboardQueryParams {
  /**
   * `YYYY-MM`, e.g. `2026-10`. Omit for the current month (server clock).
   * Produce it with `formatDashboardPeriod` — never hand-build the string.
   */
  period?: string;
}

export const callCenterDashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /call-center/dashboard?period=YYYY-MM
    //
    // One request returns the whole snapshot (summary + daily volume + call
    // types + agent performance) so all four widgets share a consistent
    // snapshot, one loading/error state (contract §3, Q8).
    readCallCenterDashboard: builder.query<
      ApiResponse<CallCenterDashboardSnapshot>,
      CallCenterDashboardQueryParams | void
    >({
      query: (params) => ({
        url: "/call-center/dashboard",
        params: params?.period !== undefined ? { period: params.period } : undefined,
      }),
      // Distinct from the layout-config "Dashboard" tag on purpose: the
      // realtime invalidation ping (contract §7, plan E5) must refetch the
      // KPI snapshot without dragging layout CRUD along.
      providesTags: ["CallCenterDashboard"],
    }),
  }),
  // Vite HMR re-runs this module without a full page reload, which calls
  // injectEndpoints a second time. Without this, RTK Query keeps the
  // definitions registered by the previous run and an edit to a `query`
  // silently has no effect until the page is reloaded.
  overrideExisting: import.meta.env.DEV,
});

export const { useReadCallCenterDashboardQuery } = callCenterDashboardApi;
