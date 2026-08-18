// /src/components/widgets/CaseStatusWidget.tsx
// Updated: [07-07-2025] v0.1.1
import React, { useState, useEffect } from "react";
import type { DashboardWidget } from "@/core/types/dashboard";
import { AlertCircle, Clock, CheckCircle, XCircle, FileText } from "lucide-react";

export const CaseStatusWidget: React.FC<{ widget: DashboardWidget }> = ({ widget }) => {
  const [data, setData] = useState({
    open: 145,
    inProgress: 89,
    resolved: 234,
    closed: 567
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => ({
        open: Math.max(0, prev.open + Math.floor((Math.random() - 0.5) * 10)),
        inProgress: Math.max(0, prev.inProgress + Math.floor((Math.random() - 0.5) * 5)),
        resolved: Math.max(0, prev.resolved + Math.floor(Math.random() * 5)),
        closed: Math.max(0, prev.closed + Math.floor(Math.random() * 3))
      }));
    }, widget.config.refreshInterval || 30000);

    return () => clearInterval(interval);
  }, [widget.config.refreshInterval]);

  const statusItems = [
    { label: 'Open Cases', value: data.open, color: 'bg-red-500 dark:bg-red-400', icon: AlertCircle },
    { label: 'In Progress', value: data.inProgress, color: 'bg-yellow-500 dark:bg-yellow-400', icon: Clock },
    { label: 'Resolved', value: data.resolved, color: 'bg-green-500 dark:bg-green-400', icon: CheckCircle },
    { label: 'Closed', value: data.closed, color: 'bg-gray-500 dark:bg-gray-400', icon: XCircle }
  ];

  return (
    <div className="h-full bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">{widget.title}</h3>
        <FileText className="h-4 w-4 text-blue-500 dark:text-blue-400" />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {statusItems.map((item, index) => (
          <div key={index} className="text-center">
            <div className={`w-8 h-8 ${item.color} rounded-lg flex items-center justify-center mx-auto mb-2`}>
              <item.icon className="h-4 w-4 text-white dark:text-gray-900" />
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">{item.value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
