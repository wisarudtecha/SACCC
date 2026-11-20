// src/cms/components/dashboard/dispatch/useDispatchHeatmapCases.ts
//
// A separate, larger sample than the events feed, which is intentionally capped
// at DISPATCH_EVENTS_FEED_LENGTH for readability - a density map needs many more
// points than a scannable "recent events" list to look like anything. Polls
// rather than subscribing to the websocket refetch-on-event used by the events
// feed: a minute or two of staleness is acceptable for a density visualization.
import { useGetListCaseQuery } from "@/cms/store/api/caseApi";
import type { Case } from "@/cms/store/api/caseApi";

const DISPATCH_HEATMAP_CASE_SAMPLE_SIZE = 500;
const DISPATCH_HEATMAP_POLL_INTERVAL_MS = 60000;

export interface DispatchHeatmapCasesState {
  cases: Case[];
  isLoading: boolean;
}

export const useDispatchHeatmapCases = (
  options: {
    /**
     * Whether the caller is allowed to plot a heatmap at all - i.e. the tenant owns the
     * GIS add-on. `false` skips the sample fetch entirely instead of pulling 500 cases
     * for a visualization the caller is not going to render.
     */
    enabled?: boolean;
  } = {}
): DispatchHeatmapCasesState => {
  const enabled = options.enabled ?? true;
  const { data, isLoading } = useGetListCaseQuery(
    {
      start: 0,
      length: DISPATCH_HEATMAP_CASE_SAMPLE_SIZE,
      orderBy: "receivedDate",
      direction: "desc",
    },
    {
      pollingInterval: DISPATCH_HEATMAP_POLL_INTERVAL_MS,
      skip: !enabled,
    }
  );

  return { cases: data?.data ?? [], isLoading: enabled && isLoading };
};
