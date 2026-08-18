// src/components/admin/system-configuration/unit/UnitMatrixView.tsx
import React from "react";
import { Building } from "lucide-react";
import { CheckCircleIcon, CloseIcon } from "@/core/icons";
import type { EnhancedUnit } from "@/cms/types/unit";

const UnitMatrixContent: React.FC<{ units: EnhancedUnit[] }> = ({ units }) => {
  return (
    <div className="bg-white dark:bg-gray-800 py-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Unit Capability Matrix</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left p-2 font-medium text-gray-900 dark:text-white">Unit</th>
              <th className="text-center p-2 font-medium text-gray-900 dark:text-white">Emergency Medical</th>
              <th className="text-center p-2 font-medium text-gray-900 dark:text-white">Fire Rescue</th>
              <th className="text-center p-2 font-medium text-gray-900 dark:text-white">Traffic Control</th>
              <th className="text-center p-2 font-medium text-gray-900 dark:text-white">Critical Care</th>
            </tr>
          </thead>
          <tbody>
            {units.map(unit => (
              <tr key={unit.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <Building className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">{unit.unitName}</span>
                  </div>
                </td>
                <td className="text-center p-2">
                  {unit.operational?.specializations.includes("Emergency Medical") ? 
                    <CheckCircleIcon className="w-5 h-5 text-green-500 mx-auto" /> : 
                    <CloseIcon className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" />
                  }
                </td>
                <td className="text-center p-2">
                  {unit.operational?.specializations.includes("Fire Rescue") ? 
                    <CheckCircleIcon className="w-5 h-5 text-green-500 mx-auto" /> : 
                    <CloseIcon className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" />
                  }
                </td>
                <td className="text-center p-2">
                  {unit.operational?.specializations.includes("Traffic Control") ? 
                    <CheckCircleIcon className="w-5 h-5 text-green-500 mx-auto" /> : 
                    <CloseIcon className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" />
                  }
                </td>
                <td className="text-center p-2">
                  {unit.operational?.specializations.includes("Critical Care") ? 
                    <CheckCircleIcon className="w-5 h-5 text-green-500 mx-auto" /> : 
                    <CloseIcon className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" />
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UnitMatrixContent;
