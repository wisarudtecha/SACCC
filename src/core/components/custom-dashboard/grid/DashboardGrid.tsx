// src/core/components/custom-dashboard/grid/DashboardGrid.tsx
import React from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { SortableWidgetCard } from "@/core/components/custom-dashboard/grid/SortableWidgetCard";
import type { DashboardWidget } from "@/core/types/dashboardLayout";

interface DashboardGridProps {
  widgets: DashboardWidget[];
  isEditing: boolean;
  onReorder: (widgets: DashboardWidget[]) => void;
  onConfigure: (widget: DashboardWidget) => void;
  onRemove: (widgetId: string) => void;
}

export const DashboardGrid: React.FC<DashboardGridProps> = ({
  widgets,
  isEditing,
  onReorder,
  onConfigure,
  onRemove,
}) => {
  const sensors = useSensors(
    // An 8px threshold before a drag starts is what keeps the buttons inside a card
    // clickable — without it, every click on the gear icon would begin a drag.
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = widgets.findIndex(widget => widget.id === active.id);
    const newIndex = widgets.findIndex(widget => widget.id === over.id);
    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // `order` is persisted explicitly rather than implied by array index, so re-stamp it
    // from the new positions before handing the list back.
    const reordered = arrayMove(widgets, oldIndex, newIndex).map((widget, index) => ({
      ...widget,
      position: { ...widget.position, order: index },
    }));

    onReorder(reordered);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={widgets.map(widget => widget.id)}
        // rectSortingStrategy is the 2-D grid strategy; the vertical list strategy would
        // mis-handle side-by-side cards.
        strategy={rectSortingStrategy}
      >
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
          {widgets.map(widget => (
            <SortableWidgetCard
              key={widget.id}
              widget={widget}
              isEditing={isEditing}
              onConfigure={onConfigure}
              onRemove={onRemove}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
