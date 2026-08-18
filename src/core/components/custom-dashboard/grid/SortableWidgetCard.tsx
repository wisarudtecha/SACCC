// src/core/components/custom-dashboard/grid/SortableWidgetCard.tsx
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Settings, X } from "lucide-react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { WidgetHost } from "@/core/components/custom-dashboard/grid/WidgetHost";
import {
  colSpanClass,
  rowHeightClass,
  rowSpanClass,
} from "@/core/components/custom-dashboard/grid/gridClasses";
import type { DashboardWidget } from "@/core/types/dashboardLayout";

interface SortableWidgetCardProps {
  widget: DashboardWidget;
  isEditing: boolean;
  onConfigure: (widget: DashboardWidget) => void;
  onRemove: (widgetId: string) => void;
}

export const SortableWidgetCard: React.FC<SortableWidgetCardProps> = ({
  widget,
  isEditing,
  onConfigure,
  onRemove,
}) => {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id, disabled: !isEditing });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      // Attributes go on the card, but listeners go on the grip below — otherwise the
      // card would swallow clicks on its own settings and remove buttons.
      {...attributes}
      className={`
        ${colSpanClass(widget.position.colSpan)}
        ${rowSpanClass(widget.position.rowSpan)}
        ${rowHeightClass(widget.position.rowSpan)}
        relative flex flex-col rounded-lg border border-gray-200 bg-white p-4
        dark:border-gray-700 dark:bg-gray-800
        ${isEditing ? "ring-1 ring-blue-300 dark:ring-blue-600" : ""}
      `}
    >
      {isEditing && (
        <div className="absolute right-2 top-2 z-10 flex items-center gap-1">
          <button
            type="button"
            onClick={() => onConfigure(widget)}
            title={t("dashboard.custom.widget_settings")}
            className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onRemove(widget.id)}
            title={t("dashboard.custom.remove_widget")}
            className="rounded p-1 text-gray-500 hover:bg-red-100 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900 dark:hover:text-red-300"
          >
            <X className="h-4 w-4" />
          </button>
          <div
            ref={setActivatorNodeRef}
            {...listeners}
            title={t("dashboard.custom.drag_handle")}
            className="cursor-grab rounded p-1 text-gray-400 hover:text-gray-600 active:cursor-grabbing dark:hover:text-gray-200"
          >
            <GripVertical className="h-4 w-4" />
          </div>
        </div>
      )}

      <WidgetHost widget={widget} />
    </div>
  );
};
