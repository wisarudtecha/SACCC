// src/core/components/custom-dashboard/modals/WidgetLibraryModal.tsx
import React, { useMemo } from "react";
import { Modal } from "@/core/components/ui/modal";
import { useTranslation } from "@/core/hooks/useTranslation";
import { WIDGET_DEFINITIONS } from "@/core/components/custom-dashboard/widgets/registry";
import type { WidgetDefinition, WidgetGroup } from "@/core/components/custom-dashboard/widgets/types";

interface WidgetLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWidget: (widgetKey: string) => void;
}

/** Section order + label key per group. A group with no widgets is simply skipped. */
const GROUP_ORDER: { group: WidgetGroup; labelKey: string }[] = [
  { group: "case", labelKey: "dashboard.custom.groups.case" },
  { group: "product", labelKey: "dashboard.custom.groups.product" },
  { group: "kms", labelKey: "dashboard.custom.groups.kms" },
  { group: "workspace", labelKey: "dashboard.custom.groups.workspace" },
];

export const WidgetLibraryModal: React.FC<WidgetLibraryModalProps> = ({
  isOpen,
  onClose,
  onAddWidget,
}) => {
  const { t } = useTranslation();

  const sections = useMemo(() => {
    const byGroup = new Map<WidgetGroup, WidgetDefinition[]>();
    for (const definition of Object.values(WIDGET_DEFINITIONS)) {
      const list = byGroup.get(definition.group) ?? [];
      list.push(definition);
      byGroup.set(definition.group, list);
    }
    return GROUP_ORDER
      .map(entry => ({ ...entry, widgets: byGroup.get(entry.group) ?? [] }))
      .filter(section => section.widgets.length > 0);
  }, []);

  const handleAdd = (widgetKey: string) => {
    onAddWidget(widgetKey);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-h-[80vh] max-w-2xl overflow-y-auto p-6">
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        {t("dashboard.custom.add_widget")}
      </h2>

      <div className="space-y-6">
        {sections.map(section => (
          <div key={section.group}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {t(section.labelKey)}
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {section.widgets.map(definition => {
                const Icon = definition.icon;

                return (
                  <button
                    key={definition.key}
                    type="button"
                    onClick={() => handleAdd(definition.key)}
                    className="flex items-start gap-3 rounded-lg border border-gray-200 p-4 text-left transition-colors hover:border-blue-400 hover:bg-blue-50 dark:border-gray-700 dark:hover:border-blue-500 dark:hover:bg-gray-700"
                  >
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {t(definition.labelKey)}
                      </div>
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {t(definition.descriptionKey)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};
