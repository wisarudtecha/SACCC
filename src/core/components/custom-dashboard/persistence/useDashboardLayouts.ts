// src/core/components/custom-dashboard/persistence/useDashboardLayouts.ts
/**
 * The only persistence surface the dashboard page sees.
 *
 * Behind this facade sits either the real API or the localStorage mock store, selected by
 * VITE_MOCK_API. The page's code is identical either way, so flipping the flag requires no
 * component changes.
 *
 * This layer knows nothing about toasts or translation — it returns a discriminated result and
 * never throws, leaving presentation to `useDashboardLayoutActions`.
 *
 * The RTK Query hooks are always *called* (hook order must stay stable) but `skip`ped in mock
 * mode; a conditional `query`/`queryFn` inside the endpoint definition would fight strict
 * TypeScript for no benefit.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { DEV_CONFIG } from "@/core/utils/constants";
import {
  useCreateDashboardLayoutMutation,
  useDeleteDashboardLayoutMutation,
  useReadDashboardLayoutQuery,
  useUpdateDashboardLayoutMutation,
} from "@/core/store/api/dashboardLayoutApi";
import { mockLayoutStore } from "@/core/components/custom-dashboard/persistence/mockLayoutStore";
import {
  EMPTY_LAYOUTS,
  isDashboardLayout,
} from "@/core/components/custom-dashboard/persistence/layoutSelection";
import { readEntityVerdict, readMutationError } from "@/core/utils/apiResponseStatus";
import type {
  DashboardLayout,
  DashboardLayoutCreateData,
  DashboardLayoutSummary,
  DashboardLayoutUpdateData,
} from "@/core/types/dashboardLayout";

export type LayoutActionResult =
  | { ok: true; layout?: DashboardLayout; message: string }
  | { ok: false; layout?: undefined; message: string };

export interface UseDashboardLayoutsResult {
  /**
   * Metadata only — the list endpoint carries no `widgets`. Powers the switcher, default
   * resolution and ownership; never a draft (see `useDashboardLayoutDetail`).
   */
  layouts: readonly DashboardLayoutSummary[];
  isLoading: boolean;
  isFetching: boolean;
  /** The list request failed outright (transport or GraphQL errors). */
  isError: boolean;
  /** The request succeeded but there is nothing saved yet. */
  isEmpty: boolean;
  isMutating: boolean;
  refetch: () => Promise<readonly DashboardLayoutSummary[]>;
  createLayout: (data: DashboardLayoutCreateData) => Promise<LayoutActionResult>;
  updateLayout: (layoutId: string, data: DashboardLayoutUpdateData) => Promise<LayoutActionResult>;
  removeLayout: (layoutId: string) => Promise<LayoutActionResult>;
}

/**
 * Always send the complete layout, never a partial patch.
 *
 * We cannot verify whether the BFF's UpdateLayout merges or replaces. Under replace-semantics a
 * partial body would blank out `widgets`; sending everything is correct under both readings and
 * costs nothing.
 */
export const toUpdateData = (
  layout: DashboardLayout,
  overrides: Partial<DashboardLayoutCreateData> = {}
): DashboardLayoutCreateData => ({
  name: layout.name,
  isShared: layout.isShared,
  isDefault: layout.isDefault,
  widgets: layout.widgets,
  ...overrides,
});

export const useDashboardLayouts = (): UseDashboardLayoutsResult => {
  const isMock = DEV_CONFIG.MOCK_API;

  const [mockLayouts, setMockLayouts] = useState<readonly DashboardLayoutSummary[]>(EMPTY_LAYOUTS);

  const {
    data: response,
    isLoading: isQueryLoading,
    isFetching: isQueryFetching,
    isError,
    refetch: refetchQuery,
  } = useReadDashboardLayoutQuery(undefined, { skip: isMock });

  const [createMutation, { isLoading: isCreating }] = useCreateDashboardLayoutMutation();
  const [updateMutation, { isLoading: isUpdating }] = useUpdateDashboardLayoutMutation();
  const [deleteMutation, { isLoading: isDeleting }] = useDeleteDashboardLayoutMutation();

  useEffect(() => {
    if (isMock) {
      setMockLayouts(mockLayoutStore.list());
    }
  }, [isMock]);

  /**
   * Identity stability matters more than it looks: a fresh `[]` literal here changes `layouts`
   * on every render, which cascades into layout resolution and the draft-adoption effect and
   * ends in "Maximum update depth exceeded". Hence the shared frozen constant.
   */
  const layouts = useMemo<readonly DashboardLayoutSummary[]>(() => {
    if (isMock) {
      return mockLayouts;
    }
    const apiLayouts = response?.data;
    return Array.isArray(apiLayouts) ? apiLayouts : EMPTY_LAYOUTS;
  }, [isMock, mockLayouts, response]);

  const refetch = useCallback(async (): Promise<readonly DashboardLayoutSummary[]> => {
    if (isMock) {
      const next = mockLayoutStore.list();
      setMockLayouts(next);
      return next;
    }

    try {
      const result = await refetchQuery().unwrap();
      return Array.isArray(result?.data) ? result.data : EMPTY_LAYOUTS;
    }
    catch (error) {
      console.error("🚀 ~ useDashboardLayouts ~ Failed to refetch layouts:", error);
      return EMPTY_LAYOUTS;
    }
  }, [isMock, refetchQuery]);

  const createLayout = useCallback(
    async (data: DashboardLayoutCreateData): Promise<LayoutActionResult> => {
      if (isMock) {
        const created = mockLayoutStore.create(data);
        setMockLayouts(mockLayoutStore.list());
        return { ok: true, layout: created, message: "" };
      }

      try {
        const response = await createMutation(data).unwrap();
        const verdict = readEntityVerdict(response, isDashboardLayout);
        return verdict.ok
          ? { ok: true, layout: verdict.entity, message: verdict.message }
          : { ok: false, message: verdict.message };
      }
      catch (error) {
        console.error("🚀 ~ useDashboardLayouts ~ Failed to create layout:", error);
        return { ok: false, message: readMutationError(error) };
      }
    },
    [isMock, createMutation]
  );

  const updateLayout = useCallback(
    async (layoutId: string, data: DashboardLayoutUpdateData): Promise<LayoutActionResult> => {
      if (isMock) {
        const updated = mockLayoutStore.update(layoutId, data);
        setMockLayouts(mockLayoutStore.list());
        return updated
          ? { ok: true, layout: updated, message: "" }
          : { ok: false, message: "" };
      }

      try {
        const response = await updateMutation({ layoutId, data }).unwrap();
        const verdict = readEntityVerdict(response, isDashboardLayout);
        return verdict.ok
          ? { ok: true, layout: verdict.entity, message: verdict.message }
          : { ok: false, message: verdict.message };
      }
      catch (error) {
        console.error("🚀 ~ useDashboardLayouts ~ Failed to update layout:", error);
        return { ok: false, message: readMutationError(error) };
      }
    },
    [isMock, updateMutation]
  );

  /**
   * Delete has no payload to inspect — `ApiResponse<void>`'s `data` is coerced to `[]` either
   * way — so an ambiguous envelope is resolved by observation: refetch and check the id is gone.
   */
  const removeLayout = useCallback(
    async (layoutId: string): Promise<LayoutActionResult> => {
      if (isMock) {
        mockLayoutStore.remove(layoutId);
        setMockLayouts(mockLayoutStore.list());
        return { ok: true, message: "" };
      }

      try {
        const response = await deleteMutation(layoutId).unwrap();
        const verdict = readEntityVerdict(response, isDashboardLayout);
        if (verdict.outcome === "failure") {
          return { ok: false, message: verdict.message };
        }

        const remaining = await refetch();
        const stillPresent = remaining.some(layout => layout.id === layoutId);
        return stillPresent
          ? { ok: false, message: verdict.message }
          : { ok: true, message: verdict.message };
      }
      catch (error) {
        console.error("🚀 ~ useDashboardLayouts ~ Failed to delete layout:", error);
        return { ok: false, message: readMutationError(error) };
      }
    },
    [isMock, deleteMutation, refetch]
  );

  return {
    layouts,
    isLoading: isMock ? false : isQueryLoading,
    isFetching: isMock ? false : isQueryFetching,
    isError: !isMock && isError,
    isEmpty: layouts.length === 0,
    isMutating: isCreating || isUpdating || isDeleting,
    refetch,
    createLayout,
    updateLayout,
    removeLayout,
  };
};
