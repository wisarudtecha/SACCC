// src/core/components/custom-dashboard/modals/WidgetConfigModal.tsx
import React, { useEffect, useState } from "react";
import { Modal } from "@/core/components/ui/modal";
import Button from "@/core/components/ui/button/Button";
import { useTranslation } from "@/core/hooks/useTranslation";
import { getWidgetDefinition } from "@/core/components/custom-dashboard/widgets/registry";
import {
  MAX_COL_SPAN,
  MAX_ROW_SPAN,
  MIN_COL_SPAN,
  MIN_ROW_SPAN,
} from "@/core/components/custom-dashboard/grid/gridClasses";
import type { DashboardWidget } from "@/core/types/dashboardLayout";

interface WidgetConfigModalProps {
  widget: DashboardWidget | null;
  onClose: () => void;
  onSave: (widgetId: string, updates: Partial<DashboardWidget>) => void;
}

const MONTH_RANGE_OPTIONS = [3, 6, 12];

const range = (min: number, max: number): number[] =>
  Array.from({ length: max - min + 1 }, (_, index) => min + index);

const fieldLabelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300";
const fieldInputClass =
  "mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white";

/** Renders only the fields the widget's registry entry declares as configurable. */
export const WidgetConfigModal: React.FC<WidgetConfigModalProps> = ({ widget, onClose, onSave }) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [showHeader, setShowHeader] = useState(true);
  const [colSpan, setColSpan] = useState(1);
  const [rowSpan, setRowSpan] = useState(1);
  const [monthRange, setMonthRange] = useState(6);

  // Re-seed the form whenever a different widget is opened.
  useEffect(() => {
    if (!widget) {
      return;
    }
    setTitle(widget.title ?? "");
    setShowHeader(widget.config.showHeader !== false);
    setColSpan(widget.position.colSpan);
    setRowSpan(widget.position.rowSpan);
    setMonthRange(widget.config.monthRange ?? 6);
  }, [widget]);

  if (!widget) {
    return null;
  }

  const definition = getWidgetDefinition(widget.widgetKey);
  const configurable = definition?.configurable ?? [];

  const handleSave = () => {
    onSave(widget.id, {
      // An empty title means "fall back to the payload's own title", so store undefined.
      title: title.trim() ? title.trim() : undefined,
      position: { ...widget.position, colSpan, rowSpan },
      config: { ...widget.config, showHeader, monthRange },
    });
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} className="max-w-md p-6">
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        {t("dashboard.custom.widget_settings")}
      </h2>

      <div className="space-y-4">
        {configurable.includes("title") && (
          <div>
            <label className={fieldLabelClass} htmlFor="widget-title">
              {t("dashboard.custom.widget_title")}
            </label>
            <input
              id="widget-title"
              type="text"
              value={title}
              onChange={event => setTitle(event.target.value)}
              placeholder={definition ? t(definition.labelKey) : ""}
              className={fieldInputClass}
            />
          </div>
        )}

        {configurable.includes("colSpan") && (
          <div>
            <label className={fieldLabelClass} htmlFor="widget-col-span">
              {t("dashboard.custom.col_span")}
            </label>
            <select
              id="widget-col-span"
              value={colSpan}
              onChange={event => setColSpan(Number(event.target.value))}
              className={fieldInputClass}
            >
              {range(MIN_COL_SPAN, MAX_COL_SPAN).map(value => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
        )}

        {configurable.includes("rowSpan") && (
          <div>
            <label className={fieldLabelClass} htmlFor="widget-row-span">
              {t("dashboard.custom.row_span")}
            </label>
            <select
              id="widget-row-span"
              value={rowSpan}
              onChange={event => setRowSpan(Number(event.target.value))}
              className={fieldInputClass}
            >
              {range(MIN_ROW_SPAN, MAX_ROW_SPAN).map(value => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
        )}

        {configurable.includes("monthRange") && (
          <div>
            <label className={fieldLabelClass} htmlFor="widget-month-range">
              {t("dashboard.custom.month_range")}
            </label>
            <select
              id="widget-month-range"
              value={monthRange}
              onChange={event => setMonthRange(Number(event.target.value))}
              className={fieldInputClass}
            >
              {MONTH_RANGE_OPTIONS.map(value => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
        )}

        {configurable.includes("showHeader") && (
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={showHeader}
              onChange={event => setShowHeader(event.target.checked)}
            />
            {t("dashboard.custom.show_header")}
          </label>
        )}
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          {t("dashboard.custom.cancel")}
        </Button>
        <Button onClick={handleSave}>
          {t("dashboard.custom.apply")}
        </Button>
      </div>
    </Modal>
  );
};
