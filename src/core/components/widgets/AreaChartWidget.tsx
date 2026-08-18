// /src/components/widgets/AreaChartWidget.tsx
// Updated: [07-07-2025] v0.1.1
import React, { useState, useEffect } from "react";
import type { DashboardWidget } from "@/core/types/dashboard";
import Button from "@/core/components/ui/button/Button";

export const AreaChartWidget: React.FC<{ widget: DashboardWidget }> = ({ widget }) => {
  const [data, setData] = useState(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map(month => ({
      month,
      primary: Math.floor(Math.random() * 100) + 150,
      secondary: Math.floor(Math.random() * 80) + 50,
      tertiary: Math.floor(Math.random() * 60) + 20
    }));
  });

  const [timeframe, setTimeframe] = useState('Monthly');

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => prev.map(item => ({
        ...item,
        primary: Math.max(50, item.primary + Math.floor((Math.random() - 0.5) * 20)),
        secondary: Math.max(20, item.secondary + Math.floor((Math.random() - 0.5) * 15)),
        tertiary: Math.max(10, item.tertiary + Math.floor((Math.random() - 0.5) * 10))
      })));
    }, widget.config.refreshInterval || 60000);

    return () => clearInterval(interval);
  }, [widget.config.refreshInterval]);

  const maxValue = Math.max(...data.flatMap(d => [d.primary, d.secondary, d.tertiary]));
  const createPath = (values: number[]) => {
    const points = values.map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 100 - (value / maxValue) * 80;
      return `${x},${y}`;
    }).join(' ');
    return `M 0,100 L ${points} L 100,100 Z`;
  };

  return (
    <div className="h-full bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">{widget.title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Target you've set for each month</p>
        </div>
        <div className="flex space-x-2">
          {['Monthly', 'Quarterly', 'Annually'].map(period => (
            <Button
              key={period}
              onClick={() => setTimeframe(period)}
              variant={`${
                timeframe === period 
                  ? 'primary' 
                  : 'outline'
              }`}
              size="sm"
            >
              {period}
            </Button>
          ))}
        </div>
      </div>
      
      <div className="h-48 relative">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1"/>
            </linearGradient>
            <linearGradient id="secondaryGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.1"/>
            </linearGradient>
            <linearGradient id="tertiaryGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.1"/>
            </linearGradient>
          </defs>
          
          <path
            d={createPath(data.map(d => d.tertiary))}
            fill="url(#tertiaryGradient)"
            stroke="#10b981"
            strokeWidth="0.5"
          />
          <path
            d={createPath(data.map(d => d.secondary))}
            fill="url(#secondaryGradient)"
            stroke="#8b5cf6"
            strokeWidth="0.5"
          />
          <path
            d={createPath(data.map(d => d.primary))}
            fill="url(#primaryGradient)"
            stroke="#3b82f6"
            strokeWidth="0.5"
          />
        </svg>
        
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 dark:text-gray-400 px-2">
          {data.slice(0, 6).map((item, index) => (
            <span key={index}>{item.month}</span>
          ))}
        </div>
      </div>
    </div>
  );
};
