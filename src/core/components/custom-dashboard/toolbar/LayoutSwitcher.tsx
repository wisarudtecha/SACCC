// src/core/components/custom-dashboard/toolbar/LayoutSwitcher.tsx
import React, { useState } from "react";
import { Check, ChevronDown, Plus } from "lucide-react";
import { Dropdown } from "@/core/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/core/components/ui/dropdown/DropdownItem";
import { useTranslation } from "@/core/hooks/useTranslation";
import { DefaultBadge, SharedBadge } from "@/core/components/custom-dashboard/toolbar/LayoutBadges";
import { DEFAULT_LAYOUT_ID } from "@/core/components/custom-dashboard/constants";
import type { DashboardLayoutSummary } from "@/core/types/dashboardLayout";

interface LayoutSwitcherProps {
  layouts: readonly DashboardLayoutSummary[];
  /** Only the name and id are read here, so a summary is enough. */
  currentLayout: DashboardLayoutSummary;
  onSelectLayout: (layoutId: string) => void;
  onCreateLayout: () => void;
  disabled?: boolean;
}

export const LayoutSwitcher: React.FC<LayoutSwitcherProps> = ({
  layouts,
  currentLayout,
  onSelectLayout,
  onCreateLayout,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  // The built-in layout exists only client-side until first saved, so show a translated label
  // for it rather than the untranslated name that would be persisted.
  const title = currentLayout.id === DEFAULT_LAYOUT_ID
    ? t("dashboard.custom.default_layout_name")
    : currentLayout.name;

  const handleSelect = (layoutId: string) => {
    setIsOpen(false);
    if (layoutId !== currentLayout.id) {
      onSelectLayout(layoutId);
    }
  };

  // Dropdown positions itself absolutely and dismisses on outside clicks unless the click
  // originated on a `.dropdown-toggle`, so both of those are required here.
  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(previous => !previous)}
        title={t("dashboard.custom.layouts")}
        className="dropdown-toggle flex items-center gap-2 rounded-lg px-2 py-1 text-left hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-gray-700"
      >
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{title}</h1>
        <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
      </button>

      <Dropdown isOpen={isOpen} onClose={() => setIsOpen(false)} className="left-0 right-auto w-72 p-2">
        <div className="max-h-72 overflow-y-auto">
          {layouts.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              {t("dashboard.custom.no_saved_layouts")}
            </div>
          )}

          {layouts.map(layout => (
            <DropdownItem
              key={layout.id}
              tag="button"
              onItemClick={() => handleSelect(layout.id)}
              baseClassName="block w-full rounded-lg px-3 py-2 text-left text-sm"
              className="text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <span className="flex items-center gap-2">
                <Check
                  className={`h-4 w-4 shrink-0 ${layout.id === currentLayout.id ? "opacity-100" : "opacity-0"}`}
                />
                <span className="min-w-0 flex-1 truncate">{layout.name}</span>
                {layout.isDefault && <DefaultBadge />}
                {layout.isShared && <SharedBadge />}
              </span>
            </DropdownItem>
          ))}
        </div>

        <div className="my-1 border-t border-gray-200 dark:border-gray-700" />

        <DropdownItem
          tag="button"
          onItemClick={() => {
            setIsOpen(false);
            onCreateLayout();
          }}
          baseClassName="block w-full rounded-lg px-3 py-2 text-left text-sm"
          className="text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-gray-700"
        >
          <span className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t("dashboard.custom.new_layout")}
          </span>
        </DropdownItem>
      </Dropdown>
    </div>
  );
};
