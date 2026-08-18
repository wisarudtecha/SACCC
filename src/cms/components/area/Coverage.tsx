// /src/components/area/Coverage.tsx
import React from "react";
import Badge from "@/core/components/ui/badge/Badge";
// import type { Area } from "@/cms/store/api/area";
import type {
  AreaCoverage,
  ResponseArea,
  ResponseMetrics
} from "@/cms/types/area";

const CoverageContent: React.FC<{
  // areas: Area[],
  areas: ResponseArea[],
  coverages: AreaCoverage[],
  metrics: ResponseMetrics[],
  color: (value: string) => void,
  percent: (value: number) => string,
  time: (value: number) => string,
}> = ({
  areas,
  coverages,
  time
}) => {
  return (
    <div className="space-y-6 cursor-default">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Unit Coverage Matrix</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Unit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Area
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Avg Response
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Effectiveness
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Capacity
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {coverages.map((coverage, index) => {
                const area = areas.find(a => a.id === coverage.areaId);
                return (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {coverage.unitName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {coverage.unitId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-900 dark:text-white">
                        {area?.areaName.en}
                        {/* {area?.districtTh || area?.districtEn}{" "} */}
                        {/* {area?.provinceTh || area?.provinceEn}{" "} */}
                        {/* {area?.countryTh || area?.countryEn} */}
                      </div>

                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {area?.areaCode}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={`capitalize ${
                        coverage.primaryResponder 
                          ? "bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                      }`} size="sm">
                        {coverage.primaryResponder ? "Primary" : `Backup L${coverage.backupLevel}`}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                      {time(coverage.averageResponseTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${coverage.effectivenessScore}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {coverage.effectivenessScore}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-900 dark:text-white">
                        {coverage.capacity.current}/{coverage.capacity.maximum}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {coverage.capacity.reserved} reserved
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CoverageContent;
