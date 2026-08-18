// /src/components/widgets/MetricWidget.tsx
import React, { useState, useEffect } from "react";
import type { DashboardWidget } from "@/core/types/dashboard";
import {
  ArrowDownIcon,
  ArrowUpIcon,
} from "@/core/icons";
import Badge from "@/core/components/ui/badge/Badge";
import { WidgetActions } from "@/core/components/widgets/WidgetActions";
import { TrendingUp } from "lucide-react";

export const MetricWidget: React.FC<{ widget: DashboardWidget }> = ({ widget }) => {
  // const [data, setData] = useState({
  //   value: 1247,
  //   label: 'Total Tickets',
  //   change: '+12%',
  //   trend: 'up'
  // });

  // Updated: [07-07-2025] v0.1.1
  const [data, setData] = useState({
    value: widget.title.includes('Cases') ? 1247 : widget.title.includes('Tickets') ? 856 : 3782,
    label: widget.title,
    change: '+12%',
    trend: 'up'
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => ({
        ...prev,
        value: prev.value + Math.floor(Math.random() * 10) - 5,
        change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 20).toFixed(1)}%`
      }));
    }, widget.config.refreshInterval || 30000);

    return () => clearInterval(interval);
  }, [widget.config.refreshInterval]);

  return (
    // Updated: [07-07-2025] v0.1.1
    // <div className="h-full bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    //   <div className="flex items-center justify-between mb-4">
    //     <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">{widget.title}</h3>
    //     <TrendingUp className="h-4 w-4 text-green-500 dark:text-green-400" />
    //   </div>
    //   <div className="space-y-2">
    //     <div className="text-2xl font-bold text-gray-900 dark:text-white">{data.value.toLocaleString()}</div>
    //     <div className="flex items-center space-x-1">
    //       <span className={`text-sm ${data.change.startsWith('+') ? 'text-green-600 dark:text-green-300' : 'text-red-600 dark:text-red-300'}`}>
    //         {data.change}
    //       </span>
    //       <span className="text-sm text-gray-500 dark:text-gray-400">vs last month</span>
    //     </div>
    //   </div>
    // </div>

    // <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
    //   <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
    //     <TrendingUp className="text-gray-800 size-6 dark:text-white/90" />
    //   </div>
    //   <div className="flex items-end justify-between mt-5">
    //     <div>
    //       <span className="text-sm text-gray-500 dark:text-gray-400">
    //         {widget.title}
    //       </span>
    //       <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
    //         {data.value.toLocaleString()}
    //       </h4>
    //     </div>
    //     <Badge color={`${data.change.startsWith('+') ? 'success' : 'error'}`}>
    //       {data.change.startsWith('+') ? <ArrowUpIcon /> : <ArrowDownIcon />}
    //       {data.change}
    //     </Badge>
    //   </div>
    // </div>

    // Updated: [08-07-2025] v0.1.2
    <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/3">
      <div className="p-6 bg-white shadow-default rounded-2xl dark:bg-gray-900">
        <div className="flex justify-between">
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
            <TrendingUp className="text-gray-800 size-6 dark:text-white/90" />
          </div>
          <WidgetActions onRemove={() => console.log('Remove')} onViewMore={() => console.log('View More')} />
        </div>
        <div className="relative">
          <div className="flex items-end justify-between mt-6">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {widget.title}
              </span>
              <h4 className="mt-3 font-bold text-gray-800 text-title-sm dark:text-white/90">
                {data.value.toLocaleString()}
              </h4>
            </div>
            <Badge color={`${data.change.startsWith('+') ? 'success' : 'error'}`}>
              {data.change.startsWith('+') ? <ArrowUpIcon /> : <ArrowDownIcon />}
              {data.change}
            </Badge>
          </div>
        </div>
      </div>
    </div>
    
    // <div className="h-full bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    //   <div className="flex items-center justify-between mb-4">
    //     <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">{widget.title}</h3>
    //     <TrendingUp className="h-4 w-4 text-green-500 dark:text-green-400" />
    //   </div>
    //   <div className="space-y-2">
    //     <div className="text-2xl font-bold text-gray-900 dark:text-white">{data.value.toLocaleString()}</div>
    //     <div className="flex items-center space-x-1">
    //       <span className={`text-sm ${data.change.startsWith('+') ? 'text-green-600 dark:text-green-300' : 'text-red-600 dark:text-red-300'}`}>
    //         {data.change}
    //       </span>
    //       <span className="text-sm text-gray-500 dark:text-gray-400">vs last month</span>
    //     </div>
    //   </div>
    // </div>
  );
};
