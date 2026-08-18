// src/core/components/custom-dashboard/useDashboardLayoutActions.ts
/**
 * Glue between the persistence facade and the page: runs a mutation, turns its result into a
 * toast, and applies the resulting state transition (selection, adopt, metadata sync).
 *
 * Kept separate from `useDashboardLayouts` so that layer stays free of translation and toast
 * concerns, and separate from the page so the page stays mostly markup.
 */
import { useCallback, useState } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { DEFAULT_LAYOUT_ID, buildBlankLayout, cloneWidgets } from "@/core/components/custom-dashboard/constants";
import { toUpdateData } from "@/core/components/custom-dashboard/persistence/useDashboardLayouts";
import type { LayoutActionResult, UseDashboardLayoutsResult } from "@/core/components/custom-dashboard/persistence/useDashboardLayouts";
import type { LayoutMetadata } from "@/core/components/custom-dashboard/useDashboardDraft";
import type { DashboardLayout } from "@/core/types/dashboardLayout";

type ToastType = "success" | "error" | "warning" | "info" | "loading";

export interface UseDashboardLayoutActionsArgs {
  persistence: UseDashboardLayoutsResult;
  draft: DashboardLayout | undefined;
  /**
   * The last server-confirmed layout. Metadata edits build their payload from this rather
   * than from a list row, because list rows carry no `widgets` — sourcing from one would send
   * an update with the widget set missing.
   */
  baseline: DashboardLayout | undefined;
  adopt: (layout: DashboardLayout) => void;
  syncMetadata: (metadata: LayoutMetadata) => void;
  /** Re-reads a layout complete with widgets; the only way to get an adoptable baseline. */
  refetchDetail: (layoutId: string) => Promise<DashboardLayout | undefined>;
  selectLayout: (layoutId: string) => void;
  clearSelection: () => void;
  addToast: (type: ToastType, message: string) => string;
  onAfterCreate?: () => void;
}

export interface DashboardLayoutActions {
  saveDraft: () => Promise<void>;
  createLayout: (name: string) => Promise<void>;
  renameLayout: (layoutId: string, name: string) => Promise<void>;
  duplicateLayout: (layoutId: string, name: string) => Promise<void>;
  deleteLayout: (layoutId: string) => Promise<void>;
  setDefaultLayout: (layoutId: string) => Promise<void>;
  toggleShared: (layoutId: string) => Promise<void>;
  isBusy: boolean;
}

export const useDashboardLayoutActions = ({
  persistence,
  draft,
  baseline,
  adopt,
  syncMetadata,
  refetchDetail,
  selectLayout,
  clearSelection,
  addToast,
  onAfterCreate,
}: UseDashboardLayoutActionsArgs): DashboardLayoutActions => {
  const { t } = useTranslation();
  const [isBusy, setIsBusy] = useState(false);

  const { layouts, createLayout: create, updateLayout: update, removeLayout: remove, refetch } = persistence;

  const entity = t("dashboard.custom.entity_name");
  const withEntity = useCallback(
    (key: string): string => t(key).replace("_ENTITY_", entity),
    [t, entity]
  );

  const notify = useCallback(
    (result: LayoutActionResult, successKey: string, errorKey: string): boolean => {
      if (result.ok) {
        addToast("success", result.message || withEntity(successKey));
        return true;
      }
      addToast("error", result.message || withEntity(errorKey));
      return false;
    },
    [addToast, withEntity]
  );

  /**
   * Produce a layout that is safe to adopt as the new baseline.
   *
   * A mutation may report success without echoing back a usable entity, and the list can never
   * supply one because it omits `widgets`. So: take the mutation's own entity if it passes the
   * strict guard, otherwise re-read the detail record.
   *
   * The `expectedId` branch is what was missing before — the previous implementation only
   * looked for an id absent from `knownIdsBefore`, which by definition never matches an update.
   * That left `adopt()` uncalled, so `isDirty` stayed true after a successful save and clicking
   * Done raised the "discard changes" prompt.
   */
  const resolveLayout = useCallback(
    async (
      result: LayoutActionResult,
      options: { expectedId?: string; knownIdsBefore?: ReadonlySet<string> }
    ): Promise<DashboardLayout | undefined> => {
      if (result.layout) {
        return result.layout;
      }

      if (options.expectedId) {
        return refetchDetail(options.expectedId);
      }

      // Create: the id is server-assigned, so find whichever row is new, then fetch it in full.
      const refreshed = await refetch();
      const created = options.knownIdsBefore
        ? refreshed.find(layout => !options.knownIdsBefore?.has(layout.id))
        : undefined;
      return created ? refetchDetail(created.id) : undefined;
    },
    [refetch, refetchDetail]
  );

  const runExclusive = useCallback(
    async (action: () => Promise<void>): Promise<void> => {
      // Guards against a double-fire; ConfirmationModal in particular closes itself immediately
      // after onConfirm and offers no busy state of its own.
      if (isBusy) {
        return;
      }
      setIsBusy(true);
      try {
        await action();
      }
      finally {
        setIsBusy(false);
      }
    },
    [isBusy]
  );

  /**
   * The server-confirmed FULL layout for an id, i.e. one that still has its widgets.
   *
   * Only the currently-loaded layout qualifies — `layouts` holds list rows, which have no
   * widgets, and feeding one of those to `toUpdateData` would send an update with the widget
   * set missing (silently wiping it under replace-semantics). Metadata actions are only ever
   * offered for the layout on screen, so `baseline` covers every real call site; anything else
   * re-reads the detail first.
   */
  const findFullLayout = useCallback(
    async (layoutId: string): Promise<DashboardLayout | undefined> => {
      if (baseline?.id === layoutId) {
        return baseline;
      }
      return refetchDetail(layoutId);
    },
    [baseline, refetchDetail]
  );

  /**
   * Metadata-only edits (rename / share / default) patch the draft as well, but only when they
   * target the layout currently on screen — otherwise editing a different layout from the
   * switcher would rewrite the one the user is looking at.
   */
  const applyMetadata = useCallback(
    (layoutId: string, metadata: LayoutMetadata, saved: DashboardLayout | undefined) => {
      if (draft?.id !== layoutId) {
        return;
      }
      syncMetadata({ ...metadata, lastModified: saved?.lastModified });
    },
    [draft?.id, syncMetadata]
  );

  const saveDraft = useCallback(async () => {
    if (!draft) {
      return;
    }

    await runExclusive(async () => {
      const isNew = draft.id === DEFAULT_LAYOUT_ID;
      const knownIds = new Set(layouts.map(layout => layout.id));

      const result = isNew
        ? await create(toUpdateData(draft))
        : await update(draft.id, toUpdateData(draft));

      const succeeded = notify(
        result,
        isNew ? "crud.common.form.action.create.success" : "crud.common.form.action.update.success",
        isNew ? "crud.common.form.action.create.error" : "crud.common.form.action.update.error"
      );
      if (!succeeded) {
        // Leave the draft dirty so the work is still there to retry.
        return;
      }

      // An update knows its own id; a create has to discover the server-assigned one.
      const saved = await resolveLayout(
        result,
        isNew ? { knownIdsBefore: knownIds } : { expectedId: draft.id }
      );

      if (saved) {
        adopt(saved);
        if (isNew) {
          // The server-assigned id replaces the "default" sentinel in both URL and localStorage.
          selectLayout(saved.id);
        }
      }
      else {
        await refetch();
      }
    });
  }, [draft, runExclusive, layouts, create, update, notify, resolveLayout, adopt, selectLayout, refetch]);

  const createLayout = useCallback(
    async (name: string) => {
      await runExclusive(async () => {
        const knownIds = new Set(layouts.map(layout => layout.id));
        const result = await create(toUpdateData(buildBlankLayout(name)));

        if (!notify(result, "crud.common.form.action.create.success", "crud.common.form.action.create.error")) {
          return;
        }

        const created = await resolveLayout(result, { knownIdsBefore: knownIds });
        if (created) {
          adopt(created);
          selectLayout(created.id);
          onAfterCreate?.();
        }
      });
    },
    [runExclusive, layouts, create, notify, resolveLayout, adopt, selectLayout, onAfterCreate]
  );

  const renameLayout = useCallback(
    async (layoutId: string, name: string) => {
      await runExclusive(async () => {
        // Built from the server-confirmed layout, not the draft — a rename must not commit
        // half-finished widget edits. It must still carry the widgets, hence findFullLayout.
        const serverCopy = await findFullLayout(layoutId);
        if (!serverCopy) {
          return;
        }

        const result = await update(layoutId, toUpdateData(serverCopy, { name }));
        if (!notify(result, "crud.common.form.action.update.success", "crud.common.form.action.update.error")) {
          return;
        }
        applyMetadata(layoutId, { name }, result.layout);
        await refetch();
      });
    },
    [findFullLayout, runExclusive, update, notify, applyMetadata, refetch]
  );

  const duplicateLayout = useCallback(
    async (layoutId: string, name: string) => {
      await runExclusive(async () => {
        const serverCopy = await findFullLayout(layoutId)
          ?? (draft?.id === layoutId ? draft : undefined);
        if (!serverCopy) {
          return;
        }

        const knownIds = new Set(layouts.map(layout => layout.id));
        const result = await create({
          name,
          isShared: false,
          isDefault: false,
          widgets: cloneWidgets(serverCopy.widgets),
        });

        if (!notify(result, "crud.common.form.action.create.success", "crud.common.form.action.create.error")) {
          return;
        }

        const created = await resolveLayout(result, { knownIdsBefore: knownIds });
        if (created) {
          adopt(created);
          selectLayout(created.id);
        }
      });
    },
    [findFullLayout, draft, runExclusive, layouts, create, notify, resolveLayout, adopt, selectLayout]
  );

  const deleteLayout = useCallback(
    async (layoutId: string) => {
      await runExclusive(async () => {
        const result = await remove(layoutId);
        if (!notify(result, "crud.common.form.action.delete.success", "crud.common.form.action.delete.error")) {
          return;
        }
        if (draft?.id === layoutId) {
          // Let resolution fall through to the default, then the first, then the local fallback.
          clearSelection();
        }
        await refetch();
      });
    },
    [runExclusive, remove, notify, draft?.id, clearSelection, refetch]
  );

  const setDefaultLayout = useCallback(
    async (layoutId: string) => {
      await runExclusive(async () => {
        const serverCopy = await findFullLayout(layoutId);
        if (!serverCopy) {
          return;
        }

        const result = await update(layoutId, toUpdateData(serverCopy, { isDefault: true }));
        if (!notify(result, "crud.common.form.action.update.success", "crud.common.form.action.update.error")) {
          return;
        }
        applyMetadata(layoutId, { isDefault: true }, result.layout);
        // Whether the server clears the previous default is unverified; the refetch is what makes
        // the real state visible either way.
        await refetch();
      });
    },
    [findFullLayout, runExclusive, update, notify, applyMetadata, refetch]
  );

  const toggleShared = useCallback(
    async (layoutId: string) => {
      await runExclusive(async () => {
        const serverCopy = await findFullLayout(layoutId);
        if (!serverCopy) {
          return;
        }

        const isShared = !serverCopy.isShared;
        const result = await update(layoutId, toUpdateData(serverCopy, { isShared }));
        if (!notify(result, "crud.common.form.action.update.success", "crud.common.form.action.update.error")) {
          return;
        }
        applyMetadata(layoutId, { isShared }, result.layout);
        await refetch();
      });
    },
    [findFullLayout, runExclusive, update, notify, applyMetadata, refetch]
  );

  return {
    saveDraft,
    createLayout,
    renameLayout,
    duplicateLayout,
    deleteLayout,
    setDefaultLayout,
    toggleShared,
    isBusy: isBusy || persistence.isMutating,
  };
};
