// /src/components/dashboard/DashboardGrid.tsx
import React, { useState } from "react";
import type { DashboardWidget } from "@/core/types/dashboard";
import { WidgetContainer } from "@/core/components/widgets/WidgetContainer";
// Updated: [07-07-2025] v0.1.1
import { ViewMoreModal } from "@/core/components/ui/modal/ViewMoreModal";
import { WidgetConfigModal } from "@/core/components/ui/modal/WidgetConfigModal";

export const DashboardGrid: React.FC<{
  widgets: DashboardWidget[];
  isCustomizing: boolean;
  // Updated: [07-07-2025] v0.1.1
  rowHeight: number;
  onUpdateWidget: (widgetId: string, updates: Partial<DashboardWidget>) => void;
  onRemoveWidget: (widgetId: string) => void;
  onReorderWidgets: (fromIndex: number, toIndex: number) => void;
}> = ({
  widgets,
  isCustomizing,
  // Updated: [07-07-2025] v0.1.1
  rowHeight,
  onUpdateWidget,
  onRemoveWidget,
  onReorderWidgets
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  // Updated: [07-07-2025] v0.1.1
  const [viewMoreWidget, setViewMoreWidget] = useState<DashboardWidget | null>(null);
  const [configWidget, setConfigWidget] = useState<DashboardWidget | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    
    if (draggedIndex !== null && draggedIndex !== index) {
      onReorderWidgets(draggedIndex, index);
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // const handleDragEnd = () => {
  //   setDraggedIndex(null);
  //   setDragOverIndex(null);
  // };

  return (
    <>
      <div
        // className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 py-6"
      >
        {widgets.map((widget, index) => (
          <div
            key={widget.id}
            // className={`
            //   ${widget.position.w === 1 ? 'col-span-1' : 'col-span-2'} 
            //   ${widget.position.h === 1 ? 'h-32' : 'h-64'}
            //   transition-all duration-200
            //   ${draggedIndex === index ? 'opacity-50 scale-95' : ''}
            //   ${dragOverIndex === index && draggedIndex !== index ? 'scale-105 ring-2 ring-blue-300 dark:ring-blue-600' : ''}
            // `}

            // className={`
            //   ${widget.position.w === 1 ? 'col-span-1' : 'col-span-2'}
            //   transition-all duration-200
            //   ${draggedIndex === index ? 'opacity-50 scale-95' : ''}
            //   ${dragOverIndex === index && draggedIndex !== index ? 'scale-105 ring-2 ring-blue-300 dark:ring-blue-600' : ''}
            // `}

            // Updated: [07-07-2025] v0.1.1
            className={`
              ${widget.position.w === 1 ? 'col-span-1' : 
                widget.position.w === 2 ? 'md:col-span-2' : 
                widget.position.w === 3 ? 'lg:col-span-3' : 'lg:col-span-4'} 
              transition-all duration-200
              ${draggedIndex === index ? 'opacity-50 scale-95' : ''}
              ${dragOverIndex === index && draggedIndex !== index ? 'scale-105 ring-2 ring-blue-300 dark:ring-blue-600' : ''}
            `}
          >
            <WidgetContainer
              widget={widget}
              index={index}
              isCustomizing={isCustomizing}
              onRemove={() => onRemoveWidget(widget.id)}
              // onConfigure={() => {
              //   console.log('Configure widget:', widget.id);
              // }}
              // Updated: [07-07-2025] v0.1.1
              onConfigure={() => setConfigWidget(widget)}
              onViewMore={() => setViewMoreWidget(widget)}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              // Updated: [07-07-2025] v0.1.1
              rowHeight={rowHeight}
            />
          </div>
        ))}
      </div>

      <ViewMoreModal
        isOpen={!!viewMoreWidget}
        onClose={() => setViewMoreWidget(null)}
        widget={viewMoreWidget!}
      />

      <WidgetConfigModal
        isOpen={!!configWidget}
        onClose={() => setConfigWidget(null)}
        widget={configWidget!}
        onUpdate={(updates) => onUpdateWidget(configWidget!.id, updates)}
      />
    </>
  );
};
