// src/components/dashboard/Dashboard.tsx
import React, { useState, useEffect, useCallback } from "react";
import PageMeta from "@/core/components/common/PageMeta";
// import PageBreadcrumb from "@/core/components/common/PageBreadCrumb";
import Button from "@/core/components/ui/button/Button";
import type { WidgetType } from "@/core/types/dashboard";
import { useDashboard } from "@/core/hooks/useDashboard";
import { DashboardHeader } from "@/core/components/dashboard/DashboardHeader";
import { DashboardGrid } from "@/core/components/dashboard/DashboardGrid";
import { WidgetLibrary } from "@/core/components/dashboard/WidgetLibrary";
import { AlertCircle, Plus } from "lucide-react";

const Dashboard: React.FC = () => {
  const {
    currentLayout,
    isCustomizing,
    setIsCustomizing,
    updateWidget,
    addWidget,
    removeWidget,
    reorderWidgets,
    // Updated: [07-07-2025] v0.1.1
    updateRowHeight
  } = useDashboard();

  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);

  const handleRefresh = useCallback(() => {
    console.log('Refreshing dashboard data...');
    currentLayout.widgets.forEach(widget => {
      updateWidget(widget.id, { isLoading: true });
      setTimeout(() => {
        updateWidget(widget.id, { isLoading: false });
      }, 1000);
    });
  }, [currentLayout.widgets, updateWidget]);

  const handleAddWidget = useCallback(() => {
    if (isCustomizing) {
      setShowWidgetLibrary(true);
    }
  }, [isCustomizing]);

  // Initialize with default widgets if empty
  useEffect(() => {
    if (currentLayout.widgets.length === 0) {
      const defaultWidgets = [
        // {
        //   type: 'metric' as WidgetType,
        //   title: 'Total Cases',
        //   config: { refreshInterval: 30000 },
        //   position: { x: 0, y: 0, w: 1, h: 1 }
        // },
        // {
        //   type: 'metric' as WidgetType,
        //   title: 'Open Cases',
        //   config: { refreshInterval: 30000 },
        //   position: { x: 1, y: 0, w: 1, h: 1 }
        // },
        // {
        //   type: 'chart' as WidgetType,
        //   title: 'Ticket Trends',
        //   config: { refreshInterval: 60000, chartType: 'bar' },
        //   position: { x: 2, y: 0, w: 2, h: 2 }
        // },
        // {
        //   type: 'table' as WidgetType,
        //   title: 'Recent Cases',
        //   config: { refreshInterval: 30000 },
        //   position: { x: 0, y: 1, w: 2, h: 2 }
        // },
        // {
        //   type: 'activity' as WidgetType,
        //   title: 'Recent Activity',
        //   config: { refreshInterval: 15000 },
        //   position: { x: 0, y: 2, w: 2, h: 2 }
        // }

        // Updated: [07-07-2025] v0.1.1
        {
          type: 'metric' as WidgetType,
          title: 'Total Cases',
          config: { refreshInterval: 30000 },
          position: { x: 0, y: 0, w: 1, h: 1 }
        },
        {
          type: 'metric' as WidgetType,
          title: 'Open Cases',
          config: { refreshInterval: 30000 },
          position: { x: 1, y: 0, w: 1, h: 1 }
        },
        {
          type: 'circular-progress' as WidgetType,
          title: 'Monthly Target',
          config: { refreshInterval: 60000 },
          position: { x: 2, y: 0, w: 2, h: 2 }
        },
        {
          type: 'chart' as WidgetType,
          title: 'Monthly Cases',
          config: { refreshInterval: 60000, chartType: 'bar' },
          position: { x: 0, y: 1, w: 2, h: 2 }
        },
        {
          type: 'area-chart' as WidgetType,
          title: 'Case Statistics',
          config: { refreshInterval: 60000 },
          position: { x: 0, y: 2, w: 4, h: 2 }
        },
        {
          type: 'world-map' as WidgetType,
          title: 'Cases by Location',
          config: { refreshInterval: 300000 },
          position: { x: 0, y: 3, w: 2, h: 2 }
        },
        {
          type: 'table' as WidgetType,
          title: 'Recent Cases',
          config: { refreshInterval: 30000 },
          position: { x: 2, y: 3, w: 2, h: 2 }
        },
        {
          type: 'case-status' as WidgetType,
          title: 'Case Status Overview',
          config: { refreshInterval: 30000 },
          position: { x: 0, y: 4, w: 1, h: 1 }
        },
        {
          type: 'sla-monitor' as WidgetType,
          title: 'SLA Performance',
          config: { refreshInterval: 30000 },
          position: { x: 1, y: 4, w: 1, h: 1 }
        },
        {
          type: 'activity' as WidgetType,
          title: 'Recent Activity',
          config: { refreshInterval: 15000 },
          position: { x: 2, y: 4, w: 2, h: 2 }
        }
      ];

      defaultWidgets.forEach(widget => addWidget(widget));
    }
  }, [currentLayout.widgets.length, addWidget]);

  return (
    <>
      <PageMeta
        title="React.js Workflow Visual Editor | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Workflow Visual Editor for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />

      {/* <PageBreadcrumb pageTitle="Dashboard" /> */}

      <DashboardHeader
        layoutName={currentLayout.name}
        isCustomizing={isCustomizing}
        // Updated: [07-07-2025] v0.1.1
        rowHeight={currentLayout.rowHeight}
        onToggleCustomizing={() => setIsCustomizing(!isCustomizing)}
        onAddWidget={handleAddWidget}
        onRefresh={handleRefresh}
        // Updated: [07-07-2025] v0.1.1
        onRowHeightChange={updateRowHeight}
      />
      
      {isCustomizing && (
        <div className="bg-blue-100 dark:bg-blue-800 border-b border-blue-200 dark:border-blue-700 px-6 py-3 mt-6 rounded-2xl">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-300" />
            <span className="text-sm text-blue-800 dark:text-blue-100">
              Customization mode is active. Drag widgets to reorder, click settings to configure, or add new widgets.
            </span>
          </div>
        </div>
      )}

      <DashboardGrid
        widgets={currentLayout.widgets}
        isCustomizing={isCustomizing}
        // Updated: [07-07-2025] v0.1.1
        rowHeight={currentLayout.rowHeight}
        onUpdateWidget={updateWidget}
        onRemoveWidget={removeWidget}
        onReorderWidgets={reorderWidgets}
      />

      <WidgetLibrary
        isOpen={showWidgetLibrary}
        onClose={() => setShowWidgetLibrary(false)}
        onAddWidget={addWidget}
      />

      {currentLayout.widgets.length === 0 && !isCustomizing && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-gray-400 dark:text-gray-500 text-lg mb-2">No widgets configured</div>
            <Button
              onClick={() => setIsCustomizing(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Widget
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;
