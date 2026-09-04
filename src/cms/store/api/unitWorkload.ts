// RTK Query endpoint for the bulk per-unit workload / currently-assigned-cases
// lookup used by the officer-assignment picker (singleAssignOfficer.tsx).
//
// This is the FE side of a backend capability that does not exist in this repo
// yet — the full contract (request/response shape, "active cases only", the
// 0-count rule, the GraphQL requirement) is documented on `UnitWorkload` in
// `src/cms/types/unitWorkload.ts`. Until the real endpoint ships, callers get
// stubbed data via `useUnitWorkloads` when VITE_MOCK_API="true"; this endpoint
// is still defined (and `skip`ped in mock mode) so flipping the flag needs no
// component changes — same pattern as `useDashboardLayouts`.
import { ApiResponse } from "@/cms/types";
import { baseApi } from "@/core/store/api/baseApi";
import { UnitWorkload, UnitWorkloadRequest } from "@/cms/types/unitWorkload";

/** Bulk lookup: one request for the whole visible roster, never one per officer. */
export const unitWorkloadApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUnitWorkload: builder.query<ApiResponse<UnitWorkload[]>, UnitWorkloadRequest>({
      query: ({ unitIds }) => ({
        url: "/units/workload",
        method: "POST",
        // Sorted so two callers asking for the same set of units — in any order —
        // hit the same RTK Query cache entry.
        body: { unitIds: [...unitIds].sort() },
      }),
      // Shares the "Dispatch" tag so assigning/withdrawing a unit (which
      // invalidates "Dispatch") also refreshes these counts.
      providesTags: ["Dispatch"],
    }),
  }),
  // See dispatch.ts — Vite HMR re-runs injectEndpoints; without this an edit to
  // `query` silently no-ops until a full reload.
  overrideExisting: import.meta.env.DEV,
});

export const { useGetUnitWorkloadQuery, useLazyGetUnitWorkloadQuery } = unitWorkloadApi;
