// src/core/components/custom-dashboard/persistence/useDashboardLayoutDetail.ts
/**
 * Loads the ONE layout currently on screen, complete with its widgets.
 *
 * This exists because `GetListLayout` returns metadata only — no `widgets` field at all.
 * Seeding the editable draft from a list row is what produced `widgets is not iterable`, and
 * coercing that away would have been worse: the draft would hold an empty widget set that the
 * next save writes back over the real data. So the draft has exactly one source, and it is
 * this hook.
 *
 * It is a separate hook rather than part of `useDashboardLayouts` to keep the data flow
 * acyclic: the list feeds layout selection, and selection feeds this.
 */
import { useCallback, useMemo } from "react";
import { DEV_CONFIG } from "@/core/utils/constants";
import { useLazyReadDashboardLayoutByIdQuery, useReadDashboardLayoutByIdQuery } from "@/core/store/api/dashboardLayoutApi";
import { mockLayoutStore } from "@/core/components/custom-dashboard/persistence/mockLayoutStore";
import { isDashboardLayoutSummary } from "@/core/components/custom-dashboard/persistence/layoutSelection";
import { DEFAULT_LAYOUT_ID } from "@/core/components/custom-dashboard/constants";
import type { DashboardLayout } from "@/core/types/dashboardLayout";

export interface UseDashboardLayoutDetailResult {
  layout: DashboardLayout | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  /** Re-read a layout by id and return it, for adopting a fresh baseline after a save. */
  refetchDetail: (layoutId: string) => Promise<DashboardLayout | undefined>;
}

/**
 * The single normalization point for `widgets`.
 *
 * A detail response is authoritative: if it omits `widgets`, the layout genuinely has none,
 * so defaulting to `[]` here is safe in a way it never is for a list row. Everything
 * downstream (`sortByOrder` in useDashboardDraft) stays strict, so any *new* path that
 * smuggles in a widget-less layout still fails loudly instead of silently emptying itself.
 */
const toFullLayout = (value: unknown): DashboardLayout | undefined => {
  if (!isDashboardLayoutSummary(value)) {
    return undefined;
  }
  const candidate = value as DashboardLayout;
  return {
    ...candidate,
    widgets: Array.isArray(candidate.widgets) ? candidate.widgets : [],
  };
};

export const useDashboardLayoutDetail = (
  selectedLayoutId: string | undefined
): UseDashboardLayoutDetailResult => {
  const isMock = DEV_CONFIG.MOCK_API;

  // The built-in fallback layout exists only client-side, so there is nothing to fetch for it.
  const isFetchable = Boolean(selectedLayoutId) && selectedLayoutId !== DEFAULT_LAYOUT_ID;

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
  } = useReadDashboardLayoutByIdQuery(selectedLayoutId ?? "", {
    skip: isMock || !isFetchable,
  });

  const [triggerDetail] = useLazyReadDashboardLayoutByIdQuery();

  // Re-read the mock store whenever it has been written to; see mockLayoutStore.revision().
  const mockRevision = isMock ? mockLayoutStore.revision() : 0;

  const layout = useMemo<DashboardLayout | undefined>(() => {
    if (!isFetchable || !selectedLayoutId) {
      return undefined;
    }
    if (isMock) {
      return mockLayoutStore.get(selectedLayoutId);
    }
    return toFullLayout(response?.data);
    // `mockRevision` looks unused to the linter because the memo body calls the store rather
    // than reading the number. It is the invalidation signal for that call — dropping it makes
    // mock mode serve a pre-mutation layout after every save.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMock, isFetchable, selectedLayoutId, response, mockRevision]);

  const refetchDetail = useCallback(
    async (layoutId: string): Promise<DashboardLayout | undefined> => {
      if (!layoutId || layoutId === DEFAULT_LAYOUT_ID) {
        return undefined;
      }
      if (isMock) {
        return mockLayoutStore.get(layoutId);
      }

      try {
        const result = await triggerDetail(layoutId).unwrap();
        return toFullLayout(result?.data);
      }
      catch (error) {
        console.error("🚀 ~ useDashboardLayoutDetail ~ Failed to re-read layout:", error);
        return undefined;
      }
    },
    [isMock, triggerDetail]
  );

  return {
    layout,
    // Deliberately `isLoading`, not `isFetching`. RTK Query reports isLoading for each new
    // argument, so switching to a layout we haven't seen still blocks on its widgets; but a
    // background refetch of an already-cached layout (which every mutation triggers via tag
    // invalidation) keeps rendering the cached data instead of blanking the page to a spinner.
    isLoading: !isMock && isFetchable && isLoading,
    isFetching: !isMock && isFetchable && isFetching,
    isError: !isMock && isFetchable && isError,
    refetchDetail,
  };
};
