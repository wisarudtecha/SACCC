// src/core/components/custom-dashboard/CustomDashboardPage.tsx
import React, { useCallback, useMemo, useState } from "react";
import PageMeta from "@/core/components/common/PageMeta";
import { LoadingSpinner } from "@/core/components/ui/loading/LoadingSystem";
import { ToastContainer } from "@/core/components/crud/ToastContainer";
import { useToast } from "@/core/hooks/useToast";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useAuth } from "@/core/hooks/useAuth";
import { ConfirmationModal } from "@/cms/components/case/modal/ConfirmationModal";
import { DashboardSourceProvider } from "@/core/components/custom-dashboard/sources/DashboardSourceProvider";
import { CustomDashboardToolbar } from "@/core/components/custom-dashboard/CustomDashboardToolbar";
import { DashboardGrid } from "@/core/components/custom-dashboard/grid/DashboardGrid";
import { DashboardUnavailableNotice } from "@/core/components/custom-dashboard/DashboardUnavailableNotice";
import { WidgetLibraryModal } from "@/core/components/custom-dashboard/modals/WidgetLibraryModal";
import { WidgetConfigModal } from "@/core/components/custom-dashboard/modals/WidgetConfigModal";
import { LayoutNameModal } from "@/core/components/custom-dashboard/modals/LayoutNameModal";
import { useDashboardLayouts } from "@/core/components/custom-dashboard/persistence/useDashboardLayouts";
import { useDashboardLayoutDetail } from "@/core/components/custom-dashboard/persistence/useDashboardLayoutDetail";
import { useLayoutSelection } from "@/core/components/custom-dashboard/persistence/useLayoutSelection";
import { useDashboardDraft } from "@/core/components/custom-dashboard/useDashboardDraft";
import { useDashboardLayoutActions } from "@/core/components/custom-dashboard/useDashboardLayoutActions";
import { buildDefaultLayout } from "@/core/components/custom-dashboard/constants";
import { canManageLayout } from "@/core/components/custom-dashboard/layoutOwnership";
import type { LayoutNameMode } from "@/core/components/custom-dashboard/modals/LayoutNameModal";
import type { DashboardWidget } from "@/core/types/dashboardLayout";

/** Which confirmation is currently open, if any. */
type PendingConfirm =
  | { kind: "delete" }
  | { kind: "discard"; then: () => void }
  | null;

const CustomDashboardContent: React.FC = () => {
  const { t } = useTranslation();
  const { state: authState } = useAuth();
  const { toasts, addToast, removeToast } = useToast();

  const persistence = useDashboardLayouts();
  const { layouts, isLoading, isError, isFetching, refetch } = persistence;

  /**
   * The layout shown when nothing is saved yet or the list can't be loaded.
   *
   * A lazy `useState` initializer, not a `useMemo`: `buildDefaultLayout` is impure (it stamps
   * ids from Date.now/Math.random), so calling it during render would hand the draft-adoption
   * effect a new identity on every pass and spin the page into an unbounded update loop.
   */
  const [fallbackLayout] = useState(buildDefaultLayout);

  const { selectedLayout, selectedLayoutId, selectLayout, clearSelection } = useLayoutSelection(layouts);

  /**
   * `selectedLayout` is a list row and has no widgets — the full record comes from here.
   * Seeding the draft from anything else is what threw `widgets is not iterable`.
   */
  const detail = useDashboardLayoutDetail(selectedLayoutId);

  /**
   * Only substitute the built-in layout when there genuinely is nothing saved. If a real
   * layout is selected but its detail failed to load, we must NOT fall back — the fallback
   * carries different widgets, and saving it would overwrite the real one.
   */
  const currentServerLayout = selectedLayout ? detail.layout : fallbackLayout;

  /**
   * Identity and metadata of whatever is selected, available even while its widgets are still
   * loading. Anything that only needs a name or an id reads this; only the draft needs the
   * full record.
   */
  const activeSummary = selectedLayout ?? fallbackLayout;

  const {
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
  } = useDashboardDraft(currentServerLayout);

  const [isEditing, setIsEditing] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [configuringWidget, setConfiguringWidget] = useState<DashboardWidget | null>(null);
  const [nameModalMode, setNameModalMode] = useState<LayoutNameMode | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm>(null);

  const actions = useDashboardLayoutActions({
    persistence,
    draft,
    baseline,
    adopt,
    syncMetadata,
    refetchDetail: detail.refetchDetail,
    selectLayout,
    clearSelection,
    addToast,
    onAfterCreate: () => setIsEditing(true),
  });

  const canManage = canManageLayout(activeSummary, authState.user);

  /** Route anything destructive to unsaved work through a confirmation first. */
  const guardDirty = useCallback(
    (action: () => void) => {
      if (isDirty) {
        setPendingConfirm({ kind: "discard", then: action });
        return;
      }
      action();
    },
    [isDirty]
  );

  const handleSelectLayout = useCallback(
    (layoutId: string) => guardDirty(() => selectLayout(layoutId)),
    [guardDirty, selectLayout]
  );

  const handleToggleEditing = useCallback(() => {
    if (isEditing) {
      guardDirty(() => setIsEditing(false));
      return;
    }
    setIsEditing(true);
  }, [isEditing, guardDirty]);

  const nameModalInitial = useMemo(() => {
    if (nameModalMode === "rename") {
      return activeSummary.name;
    }
    if (nameModalMode === "duplicate") {
      return `${activeSummary.name} ${t("dashboard.custom.duplicate_suffix")}`;
    }
    return "";
  }, [nameModalMode, activeSummary.name, t]);

  const handleNameSubmit = useCallback(
    async (name: string) => {
      const mode = nameModalMode;
      setNameModalMode(null);
      if (mode === "create") {
        await actions.createLayout(name);
      }
      else if (mode === "rename") {
        await actions.renameLayout(activeSummary.id, name);
      }
      else if (mode === "duplicate") {
        await actions.duplicateLayout(activeSummary.id, name);
      }
    },
    [nameModalMode, actions, activeSummary.id]
  );

  const handleConfirm = useCallback(() => {
    const pending = pendingConfirm;
    setPendingConfirm(null);
    if (!pending) {
      return;
    }
    if (pending.kind === "discard") {
      reset();
      pending.then();
      return;
    }
    void actions.deleteLayout(activeSummary.id);
  }, [pendingConfirm, reset, actions, activeSummary.id]);

  // The list, or the selected layout's widgets, are still on the way.
  if (isLoading || detail.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="xl" color="gray" />
      </div>
    );
  }

  /**
   * A selected layout whose widgets could not be loaded. Deliberately no grid and no fallback
   * layout: showing the built-in one here would invite the user to "fix" it and save, silently
   * replacing the real layout's widgets.
   */
  if (detail.isError) {
    return (
      <DashboardUnavailableNotice
        onRetry={() => void detail.refetchDetail(activeSummary.id)}
        isRetrying={detail.isFetching}
      />
    );
  }

  // The draft is seeded in an effect, so it trails the server layout by one render. Rendering
  // nothing here (rather than an error) keeps that frame from flashing a failure message.
  if (!draft) {
    return null;
  }

  const confirmCopy = pendingConfirm?.kind === "discard"
    ? {
        title: t("dashboard.custom.confirm_discard_title"),
        description: t("dashboard.custom.confirm_discard_message"),
        confirmText: t("dashboard.custom.discard"),
        variant: "primary" as const,
      }
    : {
        title: t("dashboard.custom.confirm_delete_title"),
        description: t(
          isDirty
            ? "dashboard.custom.confirm_delete_dirty_message"
            : "dashboard.custom.confirm_delete_message"
        ).replace("_NAME_", activeSummary.name),
        confirmText: t("common.delete"),
        variant: "error" as const,
      };

  return (
    <>
      <CustomDashboardToolbar
        layouts={layouts}
        currentLayout={draft}
        isEditing={isEditing}
        isDirty={isDirty}
        isSaving={actions.isBusy}
        hasRemoteUpdate={hasRemoteUpdate}
        canManage={canManage}
        onSelectLayout={handleSelectLayout}
        onCreateLayout={() => guardDirty(() => setNameModalMode("create"))}
        onRenameLayout={() => setNameModalMode("rename")}
        // Duplicate copies the saved layout and then moves the user onto the copy, so any
        // unsaved edits on the current one would be dropped silently without this guard.
        onDuplicateLayout={() => guardDirty(() => setNameModalMode("duplicate"))}
        onDeleteLayout={() => setPendingConfirm({ kind: "delete" })}
        onSetDefaultLayout={() => void actions.setDefaultLayout(activeSummary.id)}
        onToggleShared={() => void actions.toggleShared(activeSummary.id)}
        onToggleEditing={handleToggleEditing}
        onAddWidget={() => setIsLibraryOpen(true)}
        onSave={() => void actions.saveDraft()}
        onDiscard={reset}
      />

      {/* A failed list load must be visible: otherwise it is indistinguishable from having no
          layouts, and the user would edit a throwaway layout believing it was saved. Editing
          stays enabled — a transient list failure shouldn't lock the page. */}
      {isError && <DashboardUnavailableNotice onRetry={() => void refetch()} isRetrying={isFetching} />}

      {draft.widgets.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-gray-300 text-gray-500 dark:border-gray-600 dark:text-gray-400">
          {t("dashboard.custom.no_widgets")}
        </div>
      ) : (
        <DashboardGrid
          widgets={draft.widgets}
          isEditing={isEditing && canManage}
          onReorder={reorderWidgets}
          onConfigure={setConfiguringWidget}
          onRemove={removeWidget}
        />
      )}

      <WidgetLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onAddWidget={addWidget}
      />

      <WidgetConfigModal
        widget={configuringWidget}
        onClose={() => setConfiguringWidget(null)}
        onSave={updateWidget}
      />

      <LayoutNameModal
        mode={nameModalMode}
        initialName={nameModalInitial}
        isSubmitting={actions.isBusy}
        onClose={() => setNameModalMode(null)}
        onSubmit={name => void handleNameSubmit(name)}
      />

      <ConfirmationModal
        isOpen={pendingConfirm !== null}
        onClose={() => setPendingConfirm(null)}
        onConfirm={handleConfirm}
        title={confirmCopy.title}
        description={confirmCopy.description}
        confirmButtonText={confirmCopy.confirmText}
        confirmButtonVariant={confirmCopy.variant}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
};

/**
 * The customizable dashboard. Mounted at /cms/dashboard/custom, alongside — not replacing —
 * the existing ServiceDashboard at /cms.
 */
const CustomDashboardPage: React.FC = () => (
  <>
    <PageMeta
      title="Custom Dashboard | Cloud Contact Center"
      description="Customizable dashboard with live case, SLA, and workload widgets"
    />
    {/* The provider owns the single WebSocket subscription that feeds every widget. */}
    <DashboardSourceProvider>
      <CustomDashboardContent />
    </DashboardSourceProvider>
  </>
);

export default CustomDashboardPage;
