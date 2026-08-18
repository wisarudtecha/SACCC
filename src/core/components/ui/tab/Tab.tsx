// /src/components/ui/tab/Tab.tsx
import React, { useState } from "react";

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number | string;
  content: React.ReactNode;
}

interface TabsProps {
  items: TabItem[];
  defaultTab?: string;
  variant?: "default" | "underline" | "underline-icon" | "badge" | "case";
  orientation?: "horizontal" | "vertical";
  className?: string;
  currentTab?: (tabId: string) => void;
  classContent?: string;
  classTab?:string
}

const Tabs: React.FC<TabsProps> = ({
  items,
  defaultTab,
  variant = "default",
  orientation = "horizontal",
  className = "",
  classContent = "",
  classTab = "",
  currentTab
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || items[0]?.id);

  const baseTabClass = "px-4 py-2 font-medium cursor-pointer transition-colors";
  const orientationClass = orientation === "vertical" ? "flex-col w-48" : "flex-row";
  const containerClass = orientation === "vertical" ? "flex gap-4" : "flex flex-col";

  const getTabClass = (_tabId: string, isActive: boolean) => {
    let classes = baseTabClass;

    if (orientation === "vertical") {
      classes += " text-left w-full rounded-md";
      if (isActive) {
        classes += " bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 border-l-2 border-blue-600 dark:border-blue-300";
      }
      else {
        classes += " text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800";
      }
      return classes;
    }

    // Horizontal tabs styling based on variant
    switch (variant) {
      case "underline":
      case "underline-icon":
        classes += " border-b-2 ";
        if (isActive) {
          classes += "border-blue-600 dark:border-blue-300 text-blue-600 dark:text-blue-300";
        }
        else {
          classes += "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200";
        }
        break;
      case "badge":
        classes += " rounded-lg ";
        if (isActive) {
          classes += "bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300";
        }
        else {
          classes += "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200";
        }
        break;
      case "case":
        classes = "relative px-2 md:px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors border-r border-gray-200 dark:border-gray-600 ";
        if (isActive) {
          classes += "text-gray-900 dark:text-white bg-white dark:bg-gray-600 border-b-2 border-b-blue-500";
        } else {
          classes += "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:bg-gray-700 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-750";
        }
        break;
      default:
        classes += " rounded-t-lg ";
        if (isActive) {
          classes += "bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-t border-l border-r border-gray-200 dark:border-gray-700";
        }
        else {
          classes += "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200";
        }
    }

    return classes;
  };

  const activeTabContent = items.find(item => item.id === activeTab)?.content;

  return (
    <div className={`${containerClass} ${className} h-full`}>
      {/* Tab Headers */}
      <div className={`flex ${classTab} ${orientationClass} ${orientation === "horizontal" ? "border-b border-gray-200 dark:border-gray-700 shrink-0" : ""}`}>
        {items.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={getTabClass(item.id, isActive)}
              onClick={() => {
                setActiveTab(item.id);
                currentTab?.(item.id);
              }}
            >
              <div className="flex items-center gap-2">
                {(variant === "underline-icon" || orientation === "vertical") && item.icon && (
                  <span className="text-lg">{item.icon}</span>
                )}
                <span>{item.label}</span>
                {(variant === "badge" || orientation === "vertical") && item.badge && (
                  <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full ${isActive ? "bg-blue-600 dark:bg-blue-300 text-white dark:text-gray-900" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                    }`}>
                    {item.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className={`flex-1 min-h-0 overflow-hidden ${orientation === "vertical" ? "pt-6 border border-gray-200 dark:border-gray-700 rounded-lg" : "pt-6"} ` + classContent}>
        {activeTabContent}
      </div>
    </div>
  );
};

export default Tabs;
