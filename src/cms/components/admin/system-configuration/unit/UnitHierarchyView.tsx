// src/components/admin/system-configuration/unit/UnitHierarchyView.tsx
import React from "react";
import { Building } from "lucide-react";
import { GroupIcon } from "@/core/icons";
import type { EnhancedUnit } from "@/cms/types/unit";
import UnitStatusBadgeContent from "@/cms/components/admin/system-configuration/unit/UnitStatusBadge";

const UnitHierarchyContent: React.FC<{ units: EnhancedUnit[] }> = ({ units }) => {
  return (
    <div className="bg-white dark:bg-gray-800 py-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Organization Hierarchy</h3>
      <div className="space-y-4">
        {units.filter(unit => !unit.unitStructure?.parentUnitId)
          .map(parentUnit => (
            <div key={parentUnit.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <Building className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-gray-900 dark:text-white">{parentUnit.unitName}</span>
                <UnitStatusBadgeContent status={parentUnit.active ? "active" : "inactive"} />
              </div>
              
              {/* Sub-units */}
              <div className="ml-8 space-y-2">
                {units.filter(unit => unit.unitStructure?.parentUnitId === parentUnit.id)
                  .map(subUnit => (
                    <div key={subUnit.id} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <GroupIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{subUnit.unitName}</span>
                      <UnitStatusBadgeContent status={subUnit.operational?.availability.status || "offline"} />
                    </div>
                  ))
                }
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
};

export default UnitHierarchyContent;
