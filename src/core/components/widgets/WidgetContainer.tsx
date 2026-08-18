// /src/components/widgets/WidgetContainer.tsx
import
  React,
  {
    // useState,
    // Updated: [07-07-2025] v0.1.1
    useEffect,
    useRef
  }
from "react";
// Updated: [07-07-2025] v0.1.1
import type { DashboardWidget } from "@/core/types/dashboard";
import { MetricWidget } from "@/core/components/widgets/MetricWidget";
import { ChartWidget } from "@/core/components/widgets/ChartWidget";
import { TableWidget } from "@/core/components/widgets/TableWidget";
import { ActivityWidget } from "@/core/components/widgets/ActivityWidget";
import { CircularProgressWidget } from "@/core/components/widgets/CircularProgressWidget";
import { AreaChartWidget } from "@/core/components/widgets/AreaChartWidget";
import { WorldMapWidget } from "@/core/components/widgets/WorldMapWidget";
import { CaseStatusWidget } from "@/cms/components/widgets/CaseStatusWidget";
import { SLAMonitorWidget } from "@/cms/components/widgets/SLAMonitorWidget";
// import Button from "@/core/components/ui/button/Button";
// Updated: [07-07-2025] v0.1.1
// import { Dropdown } from "@/core/components/ui/dropdown/Dropdown";
// import { DropdownItem } from "@/core/components/ui/dropdown/DropdownItem";
// import {
//   MoreDotIcon,
// } from "@/core/icons";
import {
  // Settings,
  // Minimize2,
  // Maximize2,
  // X,
  GripVertical,
  // Updated: [07-07-2025] v0.1.1
  // MoreVertical,
  // Eye,
  // Copy,
  // Trash2
} from "lucide-react";

export const WidgetContainer: React.FC<{
  widget: DashboardWidget;
  index: number;
  isCustomizing: boolean;
  onRemove: () => void;
  onConfigure: () => void;
  // Updated: [07-07-2025] v0.1.1
  onViewMore: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  // Updated: [07-07-2025] v0.1.1
  rowHeight: number;
}> = ({
  widget,
  index,
  isCustomizing,
  // onRemove,
  // onConfigure,
  // Updated: [07-07-2025] v0.1.1
  // onViewMore,
  onDragStart,
  onDragOver,
  onDrop,
  // Updated: [07-07-2025] v0.1.1
  // rowHeight
}) => {
  // const [isExpanded, setIsExpanded] = useState(false);
  // Updated: [07-07-2025] v0.1.1
  // const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderWidget = () => {
    switch (widget.type) {
      case 'metric':
        return <MetricWidget widget={widget} />;
      case 'chart':
        return <ChartWidget widget={widget} />;
      case 'table':
        return <TableWidget widget={widget} />;
      case 'activity':
        return <ActivityWidget widget={widget} />;
      // Updated: [07-07-2025] v0.1.1
      case 'circular-progress':
        return <CircularProgressWidget widget={widget} />;
      case 'area-chart':
        return <AreaChartWidget widget={widget} />;
      case 'world-map':
        return <WorldMapWidget widget={widget} />;
      case 'case-status':
        return <CaseStatusWidget widget={widget} />;
      case 'sla-monitor':
        return <SLAMonitorWidget widget={widget} />;
      default:
        return (
          <div className="h-full bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex items-center justify-center">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <div className="text-sm">Widget type: {widget.type}</div>
              <div className="text-xs">Not implemented</div>
            </div>
          </div>
        );
    }
  };

  return (
    <div 
      // className={`relative group ${isExpanded ? 'fixed inset-4 z-50' : ''}`}
      // Updated: [07-07-2025] v0.1.1
      className={`relative group ${isCustomizing ? 'cursor-move' : ''}`}
      draggable={isCustomizing}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      data-widget-index={index}
      // Updated: [07-07-2025] v0.1.1
      // style={{ height: `${rowHeight * widget.position.h}px` }}
    >
      {/* Updated: [07-07-2025] v0.1.1 */}
      {/* Widget Actions Dropdown */}
      {/* <div className="relative inline-block">
        <Button
          className="dropdown-toggle"
          onClick={() => setShowDropdown(!showDropdown)}
          variant="ghost"
          size="xs"
        >
          <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
        </Button>
        <Dropdown
          isOpen={showDropdown}
          onClose={() => setShowDropdown(false)}
          className="w-40 p-2"
        >
          <DropdownItem
            onItemClick={() => {
              onViewMore();
              setShowDropdown(false);
            }}
            className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
          >
            View More
          </DropdownItem>
          <DropdownItem
            onItemClick={() => {
              onRemove();
              setShowDropdown(false);
            }}
            className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
          >
            Delete
          </DropdownItem>
        </Dropdown>
      </div> */}

      {/*
      <div className="absolute top-2 right-2 z-10" ref={dropdownRef}>
        <Button
          onClick={() => setShowDropdown(!showDropdown)}
          variant="outline"
          size="xs"
          className="opacity-0 group-hover:opacity-100"
         >
          <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        </Button>
        
        {showDropdown && (
          <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-20">
            <Button
              onClick={() => {
                onViewMore();
                setShowDropdown(false);
              }}
              variant="outline"
            >
              <Eye className="h-4 w-4" />
              <span>View More</span>
            </Button>
            
            {isCustomizing && (
              <>
                <Button
                  onClick={() => {
                    onConfigure();
                    setShowDropdown(false);
                  }}
                  variant="outline"
                >
                  <Settings className="h-4 w-4" />
                  <span>Configure</span>
                </Button>
                
                <Button
                  onClick={() => {
                    // Copy widget functionality
                    setShowDropdown(false);
                  }}
                  variant="outline"
                >
                  <Copy className="h-4 w-4" />
                  <span>Duplicate</span>
                </Button>
                
                <hr className="my-1" />
                
                <Button
                  onClick={() => {
                    onRemove();
                    setShowDropdown(false);
                  }}
                  variant="error"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Remove</span>
                </Button>
              </>
            )}
          </div>
        )}
      </div>
      */}

      {/*
      {isCustomizing && (
        <>
          <div className="absolute -top-2 -right-2 z-10 flex space-x-1">
            <button
              onClick={onConfigure}
              className="w-6 h-6 bg-blue-500 dark:bg-blue-400 text-white dark:text-gray-900 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Settings className="h-3 w-3" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-6 h-6 bg-gray-500 dark:bg-gray-400 text-white dark:text-gray-900 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
            </button>
            <button
              onClick={onRemove}
              className="w-6 h-6 bg-red-500 dark:bg-red-400 text-white dark:text-gray-900 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <div className="absolute -top-2 -left-2 z-10">
            <div className="w-6 h-6 bg-gray-400 dark:bg-gray-500 text-white dark:text-gray-900 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-move">
              <GripVertical className="h-3 w-3" />
            </div>
          </div>
        </>
      )}
      */}
      
      {/*
      {isExpanded && (
        <div className="fixed inset-0 bg-gray-900 dark:bg-white bg-opacity-50 z-40" onClick={() => setIsExpanded(false)} />
      )}
      */}

      {/* Updated: [07-07-2025] v0.1.1 */}
      {/* Drag Handle */}
      {isCustomizing && (
        <div className="absolute top-2 left-2 z-10">
          <div className="w-6 h-6 bg-gray-400 dark:bg-gray-500 text-white dark:text-gray-900 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-move">
            <GripVertical className="h-3 w-3" />
          </div>
        </div>
      )}
      
      <div
        // className={`${isExpanded ? 'relative z-50' : ''} ${isCustomizing ? 'cursor-move' : ''}`}
        // Updated: [07-07-2025] v0.1.1
        className="h-full"
      >
        {renderWidget()}
      </div>
    </div>
  );
};
