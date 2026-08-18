// src/core/components/custom-dashboard/persistence/useLayoutSelection.ts
import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { LAYOUT_QUERY_PARAM } from "@/core/components/custom-dashboard/constants";
import {
  clearStoredLayoutId,
  isPersistableLayoutId,
  resolveSelectedLayout,
  writeStoredLayoutId,
} from "@/core/components/custom-dashboard/persistence/layoutSelection";
import type { DashboardLayoutSummary } from "@/core/types/dashboardLayout";

export interface LayoutSelection {
  /**
   * The resolved list row, or undefined when the list is empty (caller supplies a fallback).
   * Metadata only — the full layout comes from `useDashboardLayoutDetail`.
   */
  selectedLayout: DashboardLayoutSummary | undefined;
  selectedLayoutId: string | undefined;
  selectLayout: (layoutId: string) => void;
  clearSelection: () => void;
}

/**
 * Owns which layout is on screen, keyed by `?layout=<id>` so a dashboard is linkable and
 * survives a reload, with localStorage as a per-device memory.
 *
 * The URL is written from event handlers and from exactly one reconcile effect, never from a
 * render-phase derivation — a selection that writes during render is how you get an unbounded
 * update loop.
 */
export const useLayoutSelection = (
  layouts: readonly DashboardLayoutSummary[]
): LayoutSelection => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedId = searchParams.get(LAYOUT_QUERY_PARAM);

  const selectedLayout = useMemo(
    () => resolveSelectedLayout(layouts, requestedId),
    [layouts, requestedId]
  );

  const selectedLayoutId = selectedLayout?.id;

  const writeParam = useCallback(
    (layoutId: string | undefined) => {
      setSearchParams(
        previous => {
          const next = new URLSearchParams(previous);
          if (layoutId && isPersistableLayoutId(layoutId)) {
            next.set(LAYOUT_QUERY_PARAM, layoutId);
          }
          else {
            next.delete(LAYOUT_QUERY_PARAM);
          }
          return next;
        },
        // Choosing a layout from a dropdown is not navigation; pushing a history entry per
        // switch would make Back walk backwards through every selection the user made.
        { replace: true }
      );
    },
    [setSearchParams]
  );

  /**
   * Keep the URL in step with what is actually rendered (e.g. after falling back to the default
   * layout, or when an unknown id was requested).
   *
   * Terminating by construction: it only writes when the param disagrees with the resolved id,
   * and after the write those are equal. This is safe only because `layouts` is identity-stable
   * (see EMPTY_LAYOUTS in layoutSelection.ts) — otherwise `selectedLayout` would churn and this
   * effect would fire forever.
   */
  useEffect(() => {
    if (!selectedLayoutId || !isPersistableLayoutId(selectedLayoutId)) {
      return;
    }
    if (selectedLayoutId !== requestedId) {
      writeParam(selectedLayoutId);
    }
  }, [selectedLayoutId, requestedId, writeParam]);

  // Remember the selection for the next visit. Only real, server-assigned ids are stored.
  useEffect(() => {
    if (selectedLayoutId) {
      writeStoredLayoutId(selectedLayoutId);
    }
  }, [selectedLayoutId]);

  const selectLayout = useCallback(
    (layoutId: string) => {
      writeStoredLayoutId(layoutId);
      writeParam(layoutId);
    },
    [writeParam]
  );

  const clearSelection = useCallback(() => {
    clearStoredLayoutId();
    writeParam(undefined);
  }, [writeParam]);

  return { selectedLayout, selectedLayoutId, selectLayout, clearSelection };
};
