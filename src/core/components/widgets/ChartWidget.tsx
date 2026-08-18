// /src/components/widgets/ChartWidget.tsx
import React, { useState, useEffect } from "react";
import type { DashboardWidget } from "@/core/types/dashboard";
import { BarChart3 } from "lucide-react";

export const ChartWidget: React.FC<{ widget: DashboardWidget }> = ({ widget }) => {
  // const [data, setData] = useState(() => 
  //   Array.from({ length: 7 }, (_, i) => ({
  //     name: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
  //     value: Math.floor(Math.random() * 100) + 20
  //   }))
  // );

  // Updated: [07-07-2025] v0.1.1
  const [data, setData] = useState(() => 
    Array.from({ length: 12 }, (_, i) => ({
      name: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
      value: Math.floor(Math.random() * 400) + 100
    }))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => prev.map(item => ({
        ...item,
        value: Math.max(5, item.value + Math.floor(Math.random() * 20) - 10)
      })));
    }, widget.config.refreshInterval || 60000);

    return () => clearInterval(interval);
  }, [widget.config.refreshInterval]);

  const maxValue = Math.max(...data.map(d => d.value));

  return (
    // Updated: [07-07-2025] v0.1.1
    <div className="h-full bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">{widget.title}</h3>
        <BarChart3 className="h-4 w-4 text-blue-500 dark:text-blue-400" />
      </div>
      <div className="h-48 flex items-end justify-between space-x-1">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center space-y-2 flex-1">
            <div 
              className="w-full bg-blue-500 dark:bg-blue-400 rounded-t-sm transition-all hover:bg-blue-600 dark:hover:bg-blue-500 cursor-pointer"
              style={{ height: `${(item.value / maxValue) * 100}%` }}
              title={`${item.name}: ${item.value}`}
            ></div>
            <span className="text-xs text-gray-500 dark:text-gray-400 transform -rotate-45 origin-center">{item.name}</span>
          </div>
        ))}
      </div>
    </div>

    // <div className="h-full bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    //   <div className="flex items-center justify-between mb-4">
    //     <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">{widget.title}</h3>
    //     <BarChart3 className="h-4 w-4 text-blue-500 dark:text-blue-400" />
    //   </div>
    //   <div className="h-48 flex items-end justify-between space-x-2">
    //     {data.map((item, index) => (
    //       <div key={index} className="flex flex-col items-center space-y-2 flex-1">
    //         <div 
    //           className="w-full bg-blue-500 dark:bg-blue-400 rounded-t-sm transition-all hover:bg-blue-600 dark:hover:bg-blue-500 cursor-pointer"
    //           style={{ height: `${(item.value / maxValue) * 100}%` }}
    //           title={`${item.name}: ${item.value}`}
    //         ></div>
    //         <span className="text-xs text-gray-500 dark:text-gray-400">{item.name}</span>
    //       </div>
    //     ))}
    //   </div>
    // </div>
  );
};
