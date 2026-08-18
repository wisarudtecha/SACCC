// /src/components/widgets/WorldMapWidget.tsx
// Updated: [07-07-2025] v0.1.1
import
  React
  // ,
  // {
  //   useState
  // }
from "react";
import type { DashboardWidget } from "@/core/types/dashboard";
import { Globe } from "lucide-react";

export const WorldMapWidget: React.FC<{ widget: DashboardWidget }> = ({ widget }) => {
  // const [data, setData] = useState([
  //   { country: 'USA', customers: 2392, percentage: 79 },
  //   { country: 'France', customers: 967, percentage: 23 }
  // ]);

  const data = [
    { country: 'USA', customers: 2392, percentage: 79 },
    { country: 'France', customers: 967, percentage: 23 }
  ];

  return (
    <div className="h-full bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">{widget.title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Number of customers based on country</p>
        </div>
        <Globe className="h-4 w-4 text-blue-500 dark:text-blue-400" />
      </div>
      
      <div className="flex flex-col space-y-4">
        <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <Globe className="h-8 w-8 mx-auto mb-2" />
            <div className="text-sm">World Map</div>
            <div className="text-xs">Geographic Distribution</div>
          </div>
        </div>
        
        <div className="space-y-3">
          {data.map((country, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className={`w-6 h-4 rounded-sm ${index === 0 ? 'bg-blue-500 dark:bg-blue-400' : 'bg-red-500 dark:bg-red-400'} flex items-center justify-center`}>
                <span className="text-white dark:text-gray-900 text-xs font-bold">
                  {country.country.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{country.country}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{country.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${index === 0 ? 'bg-blue-500 dark:bg-blue-400' : 'bg-red-500 dark:bg-red-400'}`}
                    style={{ width: `${country.percentage}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{country.customers.toLocaleString()} Customers</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
