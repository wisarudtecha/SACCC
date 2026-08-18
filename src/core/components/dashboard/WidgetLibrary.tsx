// /src/components/dashboard/WidgetLibrary.tsx
import
  React,
  {
    // Updated: [07-07-2025] v0.1.1
    useState
  }
from "react";
import type { DashboardWidget, WidgetType } from "@/core/types/dashboard";
// Updated: [07-07-2025] v0.1.1
import Button from "@/core/components/ui/button/Button";
import {
  TrendingUp,
  BarChart3,
  Table,
  Activity,
  // MapPin,
  // Clock,
  X,
  // Updated: [07-07-2025] v0.1.1
  FileText,
  Timer,
  Target,
  LineChart,
  Globe
} from "lucide-react";

export const WidgetLibrary: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAddWidget: (widget: Omit<DashboardWidget, 'id'>) => void;
}> = ({ isOpen, onClose, onAddWidget }) => {
  const [activeCategory, setActiveCategory] = useState('CMS');

  // const widgetTypes = [
  //   { type: 'metric' as WidgetType, name: 'Metric Card', icon: TrendingUp, description: 'Display key metrics and KPIs' },
  //   { type: 'chart' as WidgetType, name: 'Chart', icon: BarChart3, description: 'Visualize data with charts' },
  //   { type: 'table' as WidgetType, name: 'Data Table', icon: Table, description: 'Show data in table format' },
  //   { type: 'activity' as WidgetType, name: 'Activity Feed', icon: Activity, description: 'Recent activities and updates' },
  //   { type: 'map' as WidgetType, name: 'Map View', icon: MapPin, description: 'Geographic data visualization' },
  //   { type: 'timeline' as WidgetType, name: 'Timeline', icon: Clock, description: 'Chronological events' }
  // ];

  // Updated: [07-07-2025] v0.1.1
  const widgetCategories = {
    'CMS': [
      { type: 'case-status' as WidgetType, name: 'Case Status', icon: FileText, description: 'Monitor case statuses and counts' },
      { type: 'sla-monitor' as WidgetType, name: 'SLA Monitor', icon: Timer, description: 'Track SLA compliance and performance' },
      { type: 'activity' as WidgetType, name: 'Activity Feed', icon: Activity, description: 'Recent case activities and updates' },
      { type: 'metric' as WidgetType, name: 'Total Cases', icon: TrendingUp, description: 'Display total case metrics' }
    ],
    'Analytics': [
      { type: 'circular-progress' as WidgetType, name: 'Progress Circle', icon: Target, description: 'Circular progress indicators' },
      { type: 'chart' as WidgetType, name: 'Bar Chart', icon: BarChart3, description: 'Visualize data with bar charts' },
      { type: 'area-chart' as WidgetType, name: 'Area Chart', icon: LineChart, description: 'Multi-line area charts' },
      { type: 'world-map' as WidgetType, name: 'World Map', icon: Globe, description: 'Geographic data visualization' }
    ],
    'Data': [
      { type: 'table' as WidgetType, name: 'Data Table', icon: Table, description: 'Show data in table format' },
      { type: 'metric' as WidgetType, name: 'Metric Card', icon: TrendingUp, description: 'Display key metrics and KPIs' }
    ]
  };

  const handleAddWidget = (
    type: WidgetType,
    // Updated: [07-07-2025] v0.1.1
    name: string
  ) => {
    // Updated: [07-07-2025] v0.1.1
    // const widgetSizes = {
    //   'metric': { w: 1, h: 1 },
    //   'case-status': { w: 1, h: 1 },
    //   'sla-monitor': { w: 1, h: 1 },
    //   'circular-progress': { w: 2, h: 2 },
    //   'chart': { w: 2, h: 2 },
    //   'area-chart': { w: 4, h: 2 },
    //   'world-map': { w: 2, h: 2 },
    //   'table': { w: 4, h: 2 },
    //   'activity': { w: 2, h: 2 }
    // };
    const widgetSizes: Partial<Record<WidgetType, { w: number; h: number }>> = {
      'metric': { w: 1, h: 1 },
      'case-status': { w: 1, h: 1 },
      'sla-monitor': { w: 1, h: 1 },
      'circular-progress': { w: 2, h: 2 },
      'chart': { w: 2, h: 2 },
      'area-chart': { w: 4, h: 2 },
      'world-map': { w: 2, h: 2 },
      'table': { w: 4, h: 2 },
      'activity': { w: 2, h: 2 }
    };

    // Updated: [07-07-2025] v0.1.1
    const size = widgetSizes[type] || { w: 2, h: 2 };

    const widget = {
      type,
      // title: `New ${widgetTypes.find(w => w.type === type)?.name}`,
      title: name,
      config: {
        refreshInterval: type === 'activity' ? 15000 : type === 'metric' ? 30000 : 60000,
        dataSource: 'default'
      },
      position: {
        x: 0,
        y: 0,
        // w: type === 'metric' ? 1 : 2,
        // h: type === 'metric' ? 1 : 2
        // Updated: [07-07-2025] v0.1.1
        ...size
      }
    };
    onAddWidget(widget);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-900 dark:bg-white bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add Widget</h2>
          <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Updated: [07-07-2025] v0.1.1 */}
        <div className="flex">
          <div className="w-48 border-r border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
            {Object.keys(widgetCategories).map((category) => (
              <Button
                key={category}
                onClick={() => setActiveCategory(category)}
                variant={`${
                  activeCategory === category
                    ? 'primary'
                    : 'outline'
                }`}
              >
                {category}
              </Button>
            ))}
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto max-h-96">
            <div className="grid grid-cols-1 gap-3">
              {widgetCategories[activeCategory as keyof typeof widgetCategories].map((widget) => (
                <Button
                  key={widget.type}
                  onClick={() => handleAddWidget(widget.type, widget.name)}
                  variant="info"
                >
                  <div className="flex items-start space-x-3">
                    <widget.icon className="h-5 w-5 text-gray-600 dark:text-gray-300 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{widget.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{widget.description}</div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/*
        <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
          {widgetTypes.map((widget) => (
            <button
              key={widget.type}
              onClick={() => handleAddWidget(widget.type)}
              className="w-full p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-200 transition-colors"
            >
              <div className="flex items-start space-x-3">
                <widget.icon className="h-5 w-5 text-gray-600 dark:text-gray-300 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{widget.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{widget.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
        */}
      </div>
    </div>
  );
};
