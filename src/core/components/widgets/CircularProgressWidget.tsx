// /src/components/widgets/CircularProgressWidget.tsx
// Updated: [07-07-2025] v0.1.1
import React, { useState, useEffect } from "react";
import type { DashboardWidget } from "@/core/types/dashboard";
import { Target } from "lucide-react";

export const CircularProgressWidget: React.FC<{ widget: DashboardWidget }> = ({ widget }) => {
  const [data, setData] = useState({
    percentage: 75.55,
    label: 'Monthly Target',
    description: "Target you've set for each month",
    earned: 3287,
    message: "You earn $3287 today, it's higher than last month. Keep up your good work!"
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => ({
        ...prev,
        percentage: Math.max(0, Math.min(100, prev.percentage + (Math.random() - 0.5) * 5)),
        earned: prev.earned + Math.floor((Math.random() - 0.5) * 100)
      }));
    }, widget.config.refreshInterval || 30000);

    return () => clearInterval(interval);
  }, [widget.config.refreshInterval]);

  const circumference = 2 * Math.PI * 45;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (data.percentage / 100) * circumference;

  return (
    <div className="h-full bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">{widget.title}</h3>
        <Target className="h-4 w-4 text-blue-500 dark:text-blue-400" />
      </div>
      
      <div className="flex flex-col items-center space-y-4">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="#e5e7eb"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="#3b82f6"
              strokeWidth="8"
              fill="none"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{data.percentage.toFixed(2)}%</div>
              <div className="text-xs text-green-600 dark:text-green-300">+0%</div>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{data.description}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{data.message}</p>
        </div>
        
        <div className="flex justify-between w-full text-xs">
          <div className="text-center">
            <div className="text-gray-500 dark:text-gray-400">Target</div>
            <div className="font-semibold text-red-600 dark:text-red-300">$20K ↓</div>
          </div>
          <div className="text-center">
            <div className="text-gray-500 dark:text-gray-400">Revenue</div>
            <div className="font-semibold text-green-600 dark:text-green-300">$20K ↑</div>
          </div>
          <div className="text-center">
            <div className="text-gray-500 dark:text-gray-400">Today</div>
            <div className="font-semibold text-green-600 dark:text-green-300">$20K ↑</div>
          </div>
        </div>
      </div>
    </div>
  );
};
