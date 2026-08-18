// src/components/admin/system-configuration/unit/UnitCard.tsx
import React from "react";
import {
  // Building,
  MapPin
} from "lucide-react";
import {
  // MoreDotIcon,
  PieChartIcon,
  TimeIcon
} from "@/core/icons";
import type { EnhancedUnit } from "@/cms/types/unit";
import UnitStatusBadgeContent from "@/cms/components/admin/system-configuration/unit/UnitStatusBadge";

const UnitCardContent: React.FC<{
  isSelected: boolean;
  unit: EnhancedUnit;
  handleSelectUnit: (unitId: string) => void;
  setPreviewUnit: React.Dispatch<React.SetStateAction<EnhancedUnit | null>>;
  setShowPreview: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({
  isSelected,
  unit,
  // handleSelectUnit,
  setPreviewUnit,
  setShowPreview
}) => {
  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${
        isSelected ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-700"
      }`}
      onClick={() => {
        setPreviewUnit(unit);
        setShowPreview(true);
      }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {/*
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Building className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            */}

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white truncate" title={unit.unitName}>{unit.unitName}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{unit.unitId} • {unit.plateNo}</p>
            </div>
          </div>

          {/*
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                handleSelectUnit(unit.id);
              }}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <MoreDotIcon className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          */}
        </div>

        {/* Status and Type */}
        <div className="xl:flex items-center gap-2 mb-3 justify-between">
          {/*
          <UnitStatusBadgeContent status={unit.active ? "available" : "inactive"} />
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-gray-400" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {unit.isOutArea ? "Out of Area" : "In Area"} • 
              {unit.isLogin ? " Online" : " Offline"}
            </span>
          </div>
          */}

          <UnitStatusBadgeContent status={unit.operational?.availability.status || (unit.active ? "available" : "inactive")} />
          <span className={`px-2 py-1 rounded text-sm font-medium ${
            unit.unitStructure?.unitType === "department" ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" :
            unit.unitStructure?.unitType === "team" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" :
            unit.unitStructure?.unitType === "squad" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
            "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
          }`}>
            {unit.unitStructure?.unitType || "Unknown"}
          </span>
        </div>

        {/* Metrics */}
        {unit.operational && (
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="text-center">
              <div className="text-sm text-gray-500 dark:text-gray-400">Personnel</div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {unit.operational.capacity.currentPersonnel}/{unit.operational.capacity.maxPersonnel}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500 dark:text-gray-400">Utilization</div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {unit.operational.capacity.utilizationRate}%
              </div>
            </div>
          </div>
        )}

        {/* Performance Metrics */}
        {unit.performance && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-1">
              <TimeIcon className="w-3 h-3 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">
                {unit.performance.responseMetrics.averageResponseTime}min avg
              </span>
            </div>
            <div className="flex items-center gap-1">
              <PieChartIcon className="w-3 h-3 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">
                {unit.performance.responseMetrics.slaCompliance}% SLA
              </span>
            </div>
          </div>
        )}

        {/* Location Status */}
        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <MapPin className="w-3 h-3 text-gray-400" />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {unit.isOutArea ? "Out of Area" : "In Area"} • 
            {unit.isLogin ? " Online" : " Offline"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default UnitCardContent;
