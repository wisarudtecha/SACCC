// src/components/admin/system-configuration/unit/UnitCard.tsx
import React from "react";
import type { Unit } from "@/cms/types/unit";

const UnitCardContent: React.FC<{
  unit: Unit;
  UnitLocation: React.FC<{
    isOutArea: boolean;
    isLogin: boolean;
  }>;
  UnitStatus: React.FC<{ status: "active" | "inactive" | "online" | "offline" }>
}> = ({
  unit,
  UnitLocation,
  UnitStatus
}) => {
  return (
    <div className={"xl:flex items-start justify-between mb-4"}>
      <div className="gap-3">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white truncate" title={unit.unitName}>{unit.unitName}</h3>
              {/* <p className="text-sm text-gray-500 dark:text-gray-400">{unit.unitId} • {unit.plateNo}</p> */}
              <p className="text-sm text-gray-500 dark:text-gray-400">{unit.unitId}</p>
            </div>
          </div>
        </div>

        {/* Status and Type */}
        <div className="flex items-center gap-2 mb-3 justify-start">
          <UnitStatus status={unit.active ? "active" : "inactive"} />
          <UnitLocation isOutArea={unit?.isOutArea} isLogin={unit?.isLogin} />
        </div>
      </div>
    </div>
  );
};

export default UnitCardContent;
