// /src/components/widgets/SLAMonitorWidget.tsx
// Updated: [07-07-2025] v0.1.1
import
  React
  // ,
  // {
  //   useState
  // }
from "react";
import type { DashboardWidget } from "@/core/types/dashboard";
import { Timer } from "lucide-react";

export const SLAMonitorWidget: React.FC<{ widget: DashboardWidget }> = ({ widget }) => {
  // const [data, setData] = useState({
  //   onTime: 89.5,
  //   breach: 10.5,
  //   warning: 15,
  //   average: '2.4h'
  // });

  const data = {
    onTime: 89.5,
    breach: 10.5,
    warning: 15,
    average: '2.4h'
  }

  return (
    <div className="h-full bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">{widget.title}</h3>
        <Timer className="h-4 w-4 text-orange-500 dark:text-orange-400" />
      </div>
      
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-300">{data.onTime}%</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">SLA Compliance</div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-300">On Time</span>
            <span className="text-sm font-medium text-green-600 dark:text-green-300">{data.onTime}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div className="bg-green-500 dark:bg-green-400 h-2 rounded-full" style={{ width: `${data.onTime}%` }}></div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-300">Warning</span>
            <span className="text-sm font-medium text-yellow-600 dark:text-yellow-300">{data.warning}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-300">Breach</span>
            <span className="text-sm font-medium text-red-600 dark:text-red-300">{data.breach}%</span>
          </div>
        </div>
        
        <div className="text-center pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="text-lg font-bold text-gray-900 dark:text-white">{data.average}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Avg Response Time</div>
        </div>
      </div>
    </div>
  );
};
