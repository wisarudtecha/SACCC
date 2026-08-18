// src/core/components/custom-dashboard/useDashboardDraft.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createWidget } from "@/core/components/custom-dashboard/constants";
import type { DashboardLayout, DashboardWidget } from "@/core/types/dashboardLayout";

export interface DashboardDraft {
  /** The editable copy. */
  draft: DashboardLayout | undefined;
  /** What `draft` is diffed against — the last state we know the server agreed with. */
  baseline: DashboardLayout | undefined;
  isDirty: boolean;
  /** The server changed this layout while the user had unsaved edits; surfaced in the toolbar. */
  hasRemoteUpdate: boolean;
  addWidget: (widgetKey: string) => void;
  removeWidget: (widgetId: string) => void;
  updateWidget: (widgetId: string, updates: Partial<DashboardWidget>) => void;
  reorderWidgets: (widgets: DashboardWidget[]) => void;
  reset: () => void;
  /** Force draft AND baseline to a server-confirmed layout. Call only from a settled success. */
  adopt: (layout: DashboardLayout) => void;
  /** Patch metadata into draft and baseline together, so `isDirty` is left unchanged. */
  syncMetadata: (metadata: LayoutMetadata) => void;
}

export interface LayoutMetadata {
  name?: string;
  isShared?: boolean;
  isDefault?: boolean;
  lastModified?: string;
}

const sortByOrder = (widgets: DashboardWidget[]): DashboardWidget[] =>
  [...widgets].sort((a, b) => a.position.order - b.position.order);

// const sortByOrder = (widgets: DashboardWidget[] | undefined): DashboardWidget[] => {
//   if (!Array.isArray(widgets)) {
//     return [];
//   }
//   return [...widgets].sort((a, b) => (a.position?.order ?? 0) - (b.position?.order ?? 0));
// };

const normalizeLayout = (layout: DashboardLayout): DashboardLayout => ({
  ...layout,
  widgets: sortByOrder(layout.widgets),
});

/**
 * A primitive key for "which server state is this". Using a string rather than the layout
 * object is deliberate: `normalizeToApiResponse` builds a brand-new object on every fetch, so
 * an identity-keyed effect would re-seed (and discard the user's edits) on every refetch even
 * when the bytes are identical.
 */
const seedKeyOf = (layout: DashboardLayout | undefined): string =>
  layout ? `${layout.id}::${layout.lastModified ?? ""}` : "";

/**
 * Holds the editable copy of a layout while the user is customizing.
 *
 * The server copy is never mutated. Adoption of new server state is deliberate rather than
 * automatic: an in-progress edit outranks a background refresh, because losing unsaved work
 * is worse than briefly showing a stale layout.
 */
export const useDashboardDraft = (serverLayout: DashboardLayout | undefined): DashboardDraft => {
  const [baseline, setBaseline] = useState<DashboardLayout | undefined>(undefined);
  const [draft, setDraft] = useState<DashboardLayout | undefined>(undefined);
  const [hasRemoteUpdate, setHasRemoteUpdate] = useState(false);

  /** The seed key currently reflected in `baseline`. */
  const adoptedKeyRef = useRef<string>("");

  /**
   * A newer server version we declined to adopt because the draft was dirty. Held so that
   * Discard can jump straight to it — otherwise `baseline` would stay stale forever, since the
   * adoption effect only fires when the seed key changes and it has already been seen.
   */
  const pendingRemoteRef = useRef<DashboardLayout | undefined>(undefined);

  const isDirty = useMemo(() => {
    if (!draft || !baseline) {
      return false;
    }
    return JSON.stringify(draft) !== JSON.stringify(baseline);
  }, [draft, baseline]);

  // Read dirtiness inside the adoption effect without making it a dependency — otherwise the
  // effect would re-run (and adopt) the instant an edit is undone.
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  const adopt = useCallback((layout: DashboardLayout) => {
    const normalized = normalizeLayout(layout);
    adoptedKeyRef.current = seedKeyOf(layout);
    pendingRemoteRef.current = undefined;
    setBaseline(normalized);
    setDraft(normalized);
    setHasRemoteUpdate(false);
  }, []);

  const seedKey = seedKeyOf(serverLayout);
  const currentLayoutId = serverLayout?.id;

  useEffect(() => {
    if (!serverLayout) {
      if (adoptedKeyRef.current !== "") {
        adoptedKeyRef.current = "";
        pendingRemoteRef.current = undefined;
        setBaseline(undefined);
        setDraft(undefined);
        setHasRemoteUpdate(false);
      }
      return;
    }

    // Already reflecting this exact server state.
    if (seedKey === adoptedKeyRef.current) {
      return;
    }

    const isDifferentLayout = !adoptedKeyRef.current.startsWith(`${serverLayout.id}::`);

    // A different layout means the user deliberately switched — always adopt. Same layout with
    // newer content is a background refresh, which must not clobber unsaved edits.
    if (isDifferentLayout || !isDirtyRef.current) {
      const normalized = normalizeLayout(serverLayout);
      adoptedKeyRef.current = seedKey;
      pendingRemoteRef.current = undefined;
      setBaseline(normalized);
      setDraft(normalized);
      setHasRemoteUpdate(false);
      return;
    }

    pendingRemoteRef.current = serverLayout;
    setHasRemoteUpdate(true);
    // `serverLayout` is intentionally excluded: `seedKey` is its stable primitive projection,
    // and depending on the object would defeat the whole point of this hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedKey, currentLayoutId]);

  const syncMetadata = useCallback((metadata: LayoutMetadata) => {
    const apply = (layout: DashboardLayout | undefined): DashboardLayout | undefined =>
      layout ? { ...layout, ...metadata } : layout;

    setBaseline(previous => {
      const next = apply(previous);
      if (next) {
        adoptedKeyRef.current = seedKeyOf(next);
      }
      return next;
    });
    setDraft(apply);
  }, []);

  const addWidget = useCallback((widgetKey: string) => {
    setDraft(previous => {
      if (!previous) {
        return previous;
      }
      return {
        ...previous,
        widgets: [...previous.widgets, createWidget(widgetKey, previous.widgets.length)],
      };
    });
  }, []);

  const removeWidget = useCallback((widgetId: string) => {
    setDraft(previous => {
      if (!previous) {
        return previous;
      }
      return {
        ...previous,
        widgets: previous.widgets
          .filter(widget => widget.id !== widgetId)
          .map((widget, index) => ({ ...widget, position: { ...widget.position, order: index } })),
      };
    });
  }, []);

  const updateWidget = useCallback((widgetId: string, updates: Partial<DashboardWidget>) => {
    setDraft(previous => {
      if (!previous) {
        return previous;
      }
      return {
        ...previous,
        widgets: previous.widgets.map(widget =>
          widget.id === widgetId ? { ...widget, ...updates } : widget
        ),
      };
    });
  }, []);

  const reorderWidgets = useCallback((widgets: DashboardWidget[]) => {
    setDraft(previous => (previous ? { ...previous, widgets } : previous));
  }, []);

  /**
   * Discard local edits. When a newer server version was held back because the draft was dirty,
   * discarding jumps to that version rather than to the stale baseline.
   */
  const reset = useCallback(() => {
    const pendingRemote = pendingRemoteRef.current;
    if (pendingRemote) {
      adopt(pendingRemote);
      return;
    }
    setDraft(baseline);
    setHasRemoteUpdate(false);
  }, [baseline, adopt]);

  return {
    draft,
    baseline,
    isDirty,
    hasRemoteUpdate,
    addWidget,
    removeWidget,
    updateWidget,
    reorderWidgets,
    reset,
    adopt,
    syncMetadata,
  };
};
