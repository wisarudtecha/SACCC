// /src/components/admin/system-configuration/service/ServiceAnalytics.tsx
import React from "react";
import { Activity } from "lucide-react";
import type {
  // EnhancedCaseType,
  // TypeAnalytics
} from "@/cms/types/case";

const ServiceAnalyticsContent: React.FC
  // <{
  //   analytics: Record<string, TypeAnalytics>,
  //   filteredTypes: EnhancedCaseType[],
  // }>
= (
  // {
  //   analytics,
  //   filteredTypes
  // }
) => {
  return (
    <div className="space-y-6">
      <div className="text-center py-12 text-gray-400 dark:text-gray-500 cursor-default">
        <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">Advanced Analytics Coming Soon</h3>
        <p>Detailed performance analytics, predictive modeling, and optimization recommendations will be available here.</p>
      </div>
    </div>

    // <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 cursor-default">
    //   {filteredTypes.map((type) => {
    //     const analytic = analytics[type.typeId];
    //     if (!analytic) return null;
    //     return (
    //       <div key={type.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
    //         <div className="flex items-center justify-between mb-4">
    //           <div className="flex items-center space-x-2">
    //             <span className="text-xl">{type.icon}</span>
    //             <h3 className="font-semibold text-gray-800 dark:text-gray-100">{type.en}</h3>
    //           </div>
    //           <div 
    //             className="w-3 h-3 rounded-full"
    //             style={{ backgroundColor: type.color }}
    //           />
    //         </div>
    //         <div className="space-y-4">
    //           <div className="flex justify-between">
    //             <span className="text-sm text-gray-500 dark:text-gray-400">Usage Count</span>
    //             <span className="font-medium text-gray-600 dark:text-gray-300">{analytic.usageCount}</span>
    //           </div>           
    //           <div className="flex justify-between">
    //             <span className="text-sm text-gray-500 dark:text-gray-400">Avg Resolution</span>
    //             <span className="font-medium text-gray-600 dark:text-gray-300">{analytic.averageResolutionTime}min</span>
    //           </div>
    //           <div className="flex justify-between">
    //             <span className="text-sm text-gray-500 dark:text-gray-400">SLA Compliance</span>
    //             <span className={`font-medium ${analytic.slaCompliance >= 95 ? "text-green-600 dark:text-green-300" : "text-orange-600 dark:text-orange-300"}`}>
    //               {analytic.slaCompliance}%
    //             </span>
    //           </div> 
    //           <div className="flex justify-between">
    //             <span className="text-sm text-gray-500 dark:text-gray-400">Efficiency</span>
    //             <span className="font-medium text-gray-600 dark:text-gray-300">{analytic.efficiency}%</span>
    //           </div>
    //           <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
    //             <div className="text-xs text-gray-500 dark:text-gray-400">
    //               Last used: {new Date(analytic.lastUsed).toLocaleDateString()}
    //             </div>
    //           </div>
    //         </div>
    //       </div>
    //     );
    //   })}
    // </div>
  );
};

export default ServiceAnalyticsContent;
