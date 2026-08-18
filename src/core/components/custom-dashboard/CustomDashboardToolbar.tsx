// src/core/components/custom-dashboard/CustomDashboardToolbar.tsx
import React from "react";
import { Copy, Plus } from "lucide-react";
import Button from "@/core/components/ui/button/Button";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useDashboardSources } from "@/core/components/custom-dashboard/sources/useWidgetSource";
import { LayoutSwitcher } from "@/core/components/custom-dashboard/toolbar/LayoutSwitcher";
import { LayoutActionsMenu } from "@/core/components/custom-dashboard/toolbar/LayoutActionsMenu";
import { ReadOnlyBadge } from "@/core/components/custom-dashboard/toolbar/LayoutBadges";
import { DEFAULT_LAYOUT_ID } from "@/core/components/custom-dashboard/constants";
import type { DashboardLayout, DashboardLayoutSummary } from "@/core/types/dashboardLayout";

interface CustomDashboardToolbarProps {
  /** List rows — metadata only, no widgets. */
  layouts: readonly DashboardLayoutSummary[];
  currentLayout: DashboardLayout;
  isEditing: boolean;
  isDirty: boolean;
  isSaving: boolean;
  hasRemoteUpdate: boolean;
  /** False for a shared layout owned by someone else — editing is replaced by Duplicate. */
  canManage: boolean;
  onSelectLayout: (layoutId: string) => void;
  onCreateLayout: () => void;
  onRenameLayout: () => void;
  onDuplicateLayout: () => void;
  onDeleteLayout: () => void;
  onSetDefaultLayout: () => void;
  onToggleShared: () => void;
  onToggleEditing: () => void;
  onAddWidget: () => void;
  onSave: () => void;
  onDiscard: () => void;
}

/**
 * The connection indicator matters: a widget stuck on its skeleton because the socket is down
 * looks identical to one waiting for data. This tells the two apart.
 */
const ConnectionIndicator: React.FC = () => {
  const { t } = useTranslation();
  const { connectionState, isConnected } = useDashboardSources();

  const dotColor = isConnected
    ? "bg-green-500"
    : connectionState === "connecting"
      ? "bg-yellow-500"
      : "bg-red-500";

  return (
    <span className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
      <span className={`h-2 w-2 rounded-full ${dotColor}`} />
      {isConnected ? t("dashboard.custom.connected") : t("dashboard.custom.disconnected")}
    </span>
  );
};

export const CustomDashboardToolbar: React.FC<CustomDashboardToolbarProps> = ({
  layouts,
  currentLayout,
  isEditing,
  isDirty,
  isSaving,
  hasRemoteUpdate,
  canManage,
  onSelectLayout,
  onCreateLayout,
  onRenameLayout,
  onDuplicateLayout,
  onDeleteLayout,
  onSetDefaultLayout,
  onToggleShared,
  onToggleEditing,
  onAddWidget,
  onSave,
  onDiscard,
}) => {
  const { t } = useTranslation();
  const isPersisted = currentLayout.id !== DEFAULT_LAYOUT_ID;

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <LayoutSwitcher
          layouts={layouts}
          currentLayout={currentLayout}
          onSelectLayout={onSelectLayout}
          onCreateLayout={onCreateLayout}
          disabled={isSaving}
        />

        {!canManage && <ReadOnlyBadge />}

        {!isPersisted && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            {t("dashboard.custom.unsaved_layout_hint")}
          </span>
        )}

        {isDirty && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-900 dark:text-amber-200">
            {t("dashboard.custom.unsaved_changes")}
          </span>
        )}

        {hasRemoteUpdate && (
          <span
            title={t("dashboard.custom.remote_updated_hint")}
            className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-800 dark:bg-orange-900 dark:text-orange-200"
          >
            {t("dashboard.custom.remote_updated")}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ConnectionIndicator />

        {isEditing && canManage && (
          <Button variant="outline" onClick={onAddWidget} startIcon={<Plus className="h-4 w-4" />}>
            {t("dashboard.custom.add_widget")}
          </Button>
        )}

        {isEditing && canManage && isDirty && (
          <Button variant="outline" onClick={onDiscard} disabled={isSaving}>
            {t("dashboard.custom.discard")}
          </Button>
        )}

        {isEditing && canManage && (
          <Button onClick={onSave} disabled={!isDirty || isSaving}>
            {isSaving ? t("dashboard.custom.saving") : t("dashboard.custom.save")}
          </Button>
        )}

        {canManage ? (
          <Button variant={isEditing ? "success" : "outline"} onClick={onToggleEditing}>
            {isEditing ? t("dashboard.custom.done") : t("dashboard.custom.customize")}
          </Button>
        ) : (
          // Someone else's shared layout: the only way to make it yours is to copy it.
          <Button
            variant="outline"
            onClick={onDuplicateLayout}
            startIcon={<Copy className="h-4 w-4" />}
          >
            {t("dashboard.custom.duplicate")}
          </Button>
        )}

        <LayoutActionsMenu
          layout={currentLayout}
          canManage={canManage}
          isPersisted={isPersisted}
          disabled={isSaving}
          onRename={onRenameLayout}
          onDuplicate={onDuplicateLayout}
          onDelete={onDeleteLayout}
          onSetDefault={onSetDefaultLayout}
          onToggleShared={onToggleShared}
        />
      </div>
    </div>
  );
};
