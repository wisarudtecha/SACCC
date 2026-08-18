// src/components/admin/system-configuration/unit/UnitPerformance.tsx
import React from "react";
import type { EnhancedUnit } from "@/cms/types/unit";

const UnitPerformanceContent: React.FC<{ units: EnhancedUnit[] }> = ({ units }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg py-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Performance Overview
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="text-green-700 dark:text-green-400 text-sm font-medium">Active Units</div>
          <div className="text-2xl font-bold text-green-800 dark:text-green-300">
            {units.filter(u => u.active).length}
          </div>
          <div className="text-xs text-green-600 dark:text-green-500">
            of {units.length} total
          </div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="text-blue-700 dark:text-blue-400 text-sm font-medium">Avg Response</div>
          <div className="text-2xl font-bold text-blue-800 dark:text-blue-300">
            {(units.reduce((acc, u) => acc + (u.performance?.responseMetrics.averageResponseTime || 0), 0) / units.length).toFixed(1)}m
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-500">
            across all units
          </div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <div className="text-purple-700 dark:text-purple-400 text-sm font-medium">SLA Compliance</div>
          <div className="text-2xl font-bold text-purple-800 dark:text-purple-300">
            {(units.reduce((acc, u) => acc + (u.performance?.responseMetrics.slaCompliance || 0), 0) / units.length).toFixed(1)}%
          </div>
          <div className="text-xs text-purple-600 dark:text-purple-500">
            organization avg
          </div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
          <div className="text-orange-700 dark:text-orange-400 text-sm font-medium">Total Cases</div>
          <div className="text-2xl font-bold text-orange-800 dark:text-orange-300">
            {units.reduce((acc, u) => acc + (u.performance?.responseMetrics.casesHandled || 0), 0)}
          </div>
          <div className="text-xs text-orange-600 dark:text-orange-500">
            this period
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnitPerformanceContent;
