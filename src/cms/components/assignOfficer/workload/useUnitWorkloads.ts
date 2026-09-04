// The one surface the picker uses to read per-officer workload + currently-
// assigned-case data.
//
// Behind this facade sits either the real bulk endpoint (`useGetUnitWorkloadQuery`,
// POST /units/workload) or the deterministic stub, selected by VITE_MOCK_API —
// the picker's code is identical either way. Same shape as `useDashboardLayouts`:
// the RTK hook is always called (hook order stays stable) but `skip`ped in mock
// mode.
//
// FAILURE IS ISOLATED HERE. A transport/envelope failure surfaces as `isError`
// and an empty `byUnitId`; it never throws and never reaches the base roster
// fetch, the ETA/TTL solves, or the assign action. The picker renders the roster
// exactly as it does today and only the workload / assigned-cases cells show
// their own error state.
import { useEffect, useMemo, useState } from "react";
import { DEV_CONFIG } from "@/cms/utils/constants";
import { useGetUnitWorkloadQuery } from "@/cms/store/api/unitWorkload";
import { readEnvelopeStatus } from "@/core/utils/apiResponseStatus";
import { buildStubUnitWorkloads } from "./unitWorkloadStub";
import { isUnitWorkloadArray, type UnitWorkload } from "@/cms/types/unitWorkload";

export interface UseUnitWorkloadsResult {
  /** Workload keyed by unitId. Missing key = not loaded / not returned for that unit. */
  byUnitId: Readonly<Record<string, UnitWorkload>>;
  /** True while the first fetch for the current unit set is in flight. */
  isLoading: boolean;
  /** True when the fetch failed or came back in a shape we can't trust. */
  isError: boolean;
  refetch: () => void;
}

const EMPTY: Readonly<Record<string, UnitWorkload>> = Object.freeze({});

function indexByUnitId(list: readonly UnitWorkload[]): Record<string, UnitWorkload> {
  return list.reduce<Record<string, UnitWorkload>>((accumulator, entry) => {
    accumulator[entry.unitId] = entry;
    return accumulator;
  }, {});
}

interface UseUnitWorkloadsOptions {
  unitIds: readonly string[];
  /** The picker passes `open` — nothing is fetched while the modal is closed. */
  enabled: boolean;
}

export function useUnitWorkloads({
  unitIds,
  enabled,
}: UseUnitWorkloadsOptions): UseUnitWorkloadsResult {
  const isMock = DEV_CONFIG.MOCK_API;

  // Stable primitive so the query arg / effect dep doesn't churn on every render
  // just because a new array identity came out of a parent `useMemo`.
  const unitIdsKey = useMemo(() => [...unitIds].sort().join(","), [unitIds]);
  const sortedUnitIds = useMemo(
    () => (unitIdsKey ? unitIdsKey.split(",") : []),
    [unitIdsKey]
  );

  const shouldQuery = enabled && !isMock && sortedUnitIds.length > 0;

  const { data, isLoading, isFetching, isError, refetch } = useGetUnitWorkloadQuery(
    { unitIds: sortedUnitIds },
    { skip: !shouldQuery, refetchOnMountOrArgChange: true }
  );

  const [mockByUnitId, setMockByUnitId] = useState<Readonly<Record<string, UnitWorkload>>>(EMPTY);
  useEffect(() => {
    if (isMock && enabled && sortedUnitIds.length > 0) {
      setMockByUnitId(indexByUnitId(buildStubUnitWorkloads(sortedUnitIds)));
    } else if (!enabled) {
      setMockByUnitId(EMPTY);
    }
  }, [isMock, enabled, unitIdsKey, sortedUnitIds]);

  const realResult = useMemo<{ byUnitId: Readonly<Record<string, UnitWorkload>>; isError: boolean }>(() => {
    if (!data) {
      return { byUnitId: EMPTY, isError: false };
    }
    // A conclusive "failure" envelope (HTTP 200 + status "-1") already rejects
    // the query, so we only defend against a resolved-but-wrong-shape payload
    // here — see CLAUDE.md on `readEnvelopeStatus` / truthy-but-empty payloads.
    const verdict = readEnvelopeStatus(data.status);
    if (verdict === "failure" || !isUnitWorkloadArray(data.data)) {
      return { byUnitId: EMPTY, isError: true };
    }
    return { byUnitId: indexByUnitId(data.data), isError: false };
  }, [data]);

  if (isMock) {
    return {
      byUnitId: mockByUnitId,
      isLoading: false,
      isError: false,
      refetch: () => {
        if (enabled && sortedUnitIds.length > 0) {
          setMockByUnitId(indexByUnitId(buildStubUnitWorkloads(sortedUnitIds)));
        }
      },
    };
  }

  return {
    byUnitId: realResult.byUnitId,
    isLoading: shouldQuery && (isLoading || (isFetching && Object.keys(realResult.byUnitId).length === 0)),
    isError: shouldQuery && (isError || realResult.isError),
    refetch: () => {
      if (shouldQuery) {
        void refetch();
      }
    },
  };
}
