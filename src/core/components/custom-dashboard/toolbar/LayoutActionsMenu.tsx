// src/core/components/custom-dashboard/toolbar/LayoutActionsMenu.tsx
import React, { useState } from "react";
import { Copy, MoreVertical, Pencil, Share2, Star, Trash2 } from "lucide-react";
import { Dropdown } from "@/core/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/core/components/ui/dropdown/DropdownItem";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { DashboardLayoutSummary } from "@/core/types/dashboardLayout";

interface LayoutActionsMenuProps {
  /** Only isDefault/isShared drive the menu labels, so a summary is enough. */
  layout: DashboardLayoutSummary;
  /** False for a shared layout owned by someone else, and for the unsaved built-in layout. */
  canManage: boolean;
  /** False until the layout exists server-side. */
  isPersisted: boolean;
  disabled?: boolean;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
  onToggleShared: () => void;
}

const itemBase = "block w-full rounded-lg px-3 py-2 text-left text-sm";
const itemClass = "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700";
const destructiveClass = "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-gray-700";

export const LayoutActionsMenu: React.FC<LayoutActionsMenuProps> = ({
  layout,
  canManage,
  isPersisted,
  disabled = false,
  onRename,
  onDuplicate,
  onDelete,
  onSetDefault,
  onToggleShared,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const run = (action: () => void) => {
    setIsOpen(false);
    action();
  };

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(previous => !previous)}
        title={t("dashboard.custom.layout_actions")}
        className="dropdown-toggle rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:text-gray-400 dark:hover:bg-gray-700"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      <Dropdown isOpen={isOpen} onClose={() => setIsOpen(false)} className="w-56 p-2">
        {/* Duplicate is always available — it is the escape hatch that makes a read-only
            shared layout useful, by giving the viewer their own editable copy. */}
        <DropdownItem
          tag="button"
          onItemClick={() => run(onDuplicate)}
          baseClassName={itemBase}
          className={itemClass}
        >
          <span className="flex items-center gap-2">
            <Copy className="h-4 w-4" />
            {t("dashboard.custom.duplicate_layout")}
          </span>
        </DropdownItem>

        {canManage && isPersisted && (
          <>
            <DropdownItem
              tag="button"
              onItemClick={() => run(onRename)}
              baseClassName={itemBase}
              className={itemClass}
            >
              <span className="flex items-center gap-2">
                <Pencil className="h-4 w-4" />
                {t("dashboard.custom.rename_layout")}
              </span>
            </DropdownItem>

            {!layout.isDefault && (
              <DropdownItem
                tag="button"
                onItemClick={() => run(onSetDefault)}
                baseClassName={itemBase}
                className={itemClass}
              >
                <span className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  {t("dashboard.custom.set_default")}
                </span>
              </DropdownItem>
            )}

            <DropdownItem
              tag="button"
              onItemClick={() => run(onToggleShared)}
              baseClassName={itemBase}
              className={itemClass}
            >
              <span className="flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                {layout.isShared
                  ? t("dashboard.custom.unshare_layout")
                  : t("dashboard.custom.share_layout")}
              </span>
            </DropdownItem>

            <div className="my-1 border-t border-gray-200 dark:border-gray-700" />

            <DropdownItem
              tag="button"
              onItemClick={() => run(onDelete)}
              baseClassName={itemBase}
              className={destructiveClass}
            >
              <span className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                {t("dashboard.custom.delete_layout")}
              </span>
            </DropdownItem>
          </>
        )}
      </Dropdown>
    </div>
  );
};
