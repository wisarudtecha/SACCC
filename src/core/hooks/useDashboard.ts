// /src/hooks/useDashboard.ts
import { useState, useCallback, useMemo } from "react";
import type { DashboardWidget, DashboardLayout } from "@/core/types/dashboard";

export const useDashboard = () => {
  const [layouts, setLayouts] = useState<DashboardLayout[]>([]);
  const [activeLayout, setActiveLayout] = useState<string>('default');
  const [isCustomizing, setIsCustomizing] = useState(false);

  const currentLayout = useMemo(() => 
    layouts.find(layout => layout.id === activeLayout) || {
      id: 'default',
      name: 'Default Dashboard',
      widgets: [],
      isShared: false,
      createdBy: 'current-user',
      lastModified: new Date(),
      // Updated: [07-07-2025] v0.1.1
      rowHeight: 200
    }
  , [layouts, activeLayout]);

  const updateWidget = useCallback((widgetId: string, updates: Partial<DashboardWidget>) => {
    setLayouts(prev => prev.map(layout => 
      layout.id === activeLayout 
        ? {
            ...layout,
            widgets: layout.widgets.map(widget =>
              widget.id === widgetId ? { ...widget, ...updates } : widget
            ),
            lastModified: new Date()
          }
        : layout
    ));
  }, [activeLayout]);

  const addWidget = useCallback((widget: Omit<DashboardWidget, 'id'>) => {
    const newWidget: DashboardWidget = {
      ...widget,
      id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    setLayouts(prev => {
      const existing = prev.find(l => l.id === activeLayout);
      if (existing) {
        return prev.map(layout => 
          layout.id === activeLayout 
            ? {
                ...layout,
                widgets: [...layout.widgets, newWidget],
                lastModified: new Date()
              }
            : layout
        );
      }
      else {
        const newLayout: DashboardLayout = {
          id: activeLayout,
          name: 'Default Dashboard',
          widgets: [newWidget],
          isShared: false,
          createdBy: 'current-user',
          lastModified: new Date(),
          // Updated: [07-07-2025] v0.1.1
          rowHeight: 200
        };
        return [...prev, newLayout];
      }
    });
  }, [activeLayout]);

  const removeWidget = useCallback((widgetId: string) => {
    setLayouts(prev => prev.map(layout => 
      layout.id === activeLayout 
        ? {
            ...layout,
            widgets: layout.widgets.filter(widget => widget.id !== widgetId),
            lastModified: new Date()
          }
        : layout
    ));
  }, [activeLayout]);

  const reorderWidgets = useCallback((fromIndex: number, toIndex: number) => {
    setLayouts(prev => prev.map(layout => 
      layout.id === activeLayout 
        ? {
            ...layout,
            widgets: (() => {
              const newWidgets = [...layout.widgets];
              const [moved] = newWidgets.splice(fromIndex, 1);
              newWidgets.splice(toIndex, 0, moved);
              return newWidgets;
            })(),
            lastModified: new Date()
          }
        : layout
    ));
  }, [activeLayout]);

  // Updated: [07-07-2025] v0.1.1
  const updateRowHeight = useCallback((height: number) => {
    setLayouts(prev => prev.map(layout => 
      layout.id === activeLayout 
        ? { ...layout, rowHeight: height, lastModified: new Date() }
        : layout
    ));
  }, [activeLayout]);

  return {
    layouts,
    currentLayout,
    activeLayout,
    setActiveLayout,
    isCustomizing,
    setIsCustomizing,
    updateWidget,
    addWidget,
    removeWidget,
    reorderWidgets,
    // Updated: [07-07-2025] v0.1.1
    updateRowHeight
  };
};
