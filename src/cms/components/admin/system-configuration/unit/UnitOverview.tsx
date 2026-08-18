// src/components/admin/system-configuration/unit/UnitOverview.tsx
import React, { useState } from "react";
import { Building, Eye, Filter, Search } from "lucide-react";
import { PencilIcon, PieChartIcon } from "@/core/icons";
import type { EnhancedUnit, DisplayMode } from "@/cms/types/unit";
import UnitCardContent from "@/cms/components/admin/system-configuration/unit/v1/UnitCard";
import UnitPreviewModalContent from "@/cms/components/admin/system-configuration/unit/UnitPreviewModal";
import UnitStatusBadgeContent from "@/cms/components/admin/system-configuration/unit/UnitStatusBadge";

const UnitOverviewContent: React.FC<{
  filteredUnits: EnhancedUnit[];
  filterStatus: "all" | "active" | "inactive" | "maintenance";
  filterUnitType: "all" | "department" | "team" | "squad" | "individual";
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  setFilterStatus: React.Dispatch<React.SetStateAction<"all" | "active" | "inactive" | "maintenance">>;
  setFilterUnitType: React.Dispatch<React.SetStateAction<"all" | "department" | "team" | "squad" | "individual">>;
}> = ({
  filteredUnits,
  filterStatus,
  filterUnitType,
  searchTerm,
  setSearchTerm,
  setFilterStatus,
  setFilterUnitType,
}) => {
  const [displayMode, setDisplayMode] = useState<DisplayMode>("cards");
  const [selectedUnits, setSelectedUnits] = useState<Set<string>>(new Set());
  const [previewUnit, setPreviewUnit] = useState<EnhancedUnit | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Selection handlers
  // const handleSelectAll = () => {
  //   if (selectedUnits.size === filteredUnits.length) {
  //     setSelectedUnits(new Set());
  //   } else {
  //     setSelectedUnits(new Set(filteredUnits.map(unit => unit.id)));
  //   }
  // };

  const handleSelectUnit = (unitId: string) => {
    const newSelection = new Set(selectedUnits);
    if (newSelection.has(unitId)) {
      newSelection.delete(unitId);
    } else {
      newSelection.add(unitId);
    }
    setSelectedUnits(newSelection);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
      <div className="mx-auto w-full">
        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg py-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search units by name, ID, or plate number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>

              <select
                value={filterUnitType}
                onChange={(e) => setFilterUnitType(e.target.value as typeof filterUnitType)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Types</option>
                <option value="department">Department</option>
                <option value="team">Team</option>
                <option value="squad">Squad</option>
                <option value="individual">Individual</option>
              </select>

              <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">More Filters</span>
              </button>
            </div>

            {/* Display Mode Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setDisplayMode("cards")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  displayMode === "cards" 
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                Cards
              </button>
              <button
                onClick={() => setDisplayMode("table")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  displayMode === "table"
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                Table
              </button>
            </div>
          </div>

          {/* Bulk Actions */}
          {/*
          {selectedUnits.size > 0 && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  {selectedUnits.size} unit(s) selected
                </span>
                <div className="flex gap-2">
                  <button className="px-3 py-1 text-xs font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 rounded transition-colors">
                    Activate
                  </button>
                  <button className="px-3 py-1 text-xs font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 rounded transition-colors">
                    Deactivate
                  </button>
                  <button 
                    onClick={() => setSelectedUnits(new Set())}
                    className="px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}
          */}
        </div>

        {/* Content Area */}
        <div className="bg-white dark:bg-gray-800">
          {/* Table Header */}
          {displayMode === "table" && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                {/*
                <input
                  type="checkbox"
                  checked={selectedUnits.size === filteredUnits.length && filteredUnits.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-4"
                />
                */}
                
                <div className="grid grid-cols-6 gap-4 flex-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <div>Unit</div>
                  <div>Type</div>
                  <div>Status</div>
                  <div>Personnel</div>
                  <div>Performance</div>
                  <div className="text-center">Actions</div>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className={displayMode === "cards" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "divide-y divide-gray-200 dark:divide-gray-700"}>
            {filteredUnits.map((unit) => 
              displayMode === "cards" ? (
                <UnitCardContent
                  key={unit.id}
                  isSelected={selectedUnits.has(unit.id.toString())}
                  unit={unit}
                  handleSelectUnit={handleSelectUnit}
                  setPreviewUnit={setPreviewUnit}
                  setShowPreview={setShowPreview}
                />
              ) : (
                <div key={unit.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center">
                    {/*
                    <input
                      type="checkbox"
                      checked={selectedUnits.has(unit.id)}
                      onChange={() => handleSelectUnit(unit.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-4"
                    />
                    */}

                    <div className="grid grid-cols-6 gap-4 flex-1 items-center">
                      {/* Unit Info */}
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <Building className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <div className="font-medium text-sm text-gray-900 dark:text-white">{unit.unitName}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{unit.unitId}</div>
                        </div>
                      </div>

                      {/* Type */}
                      <div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          unit.unitStructure?.unitType === "department" ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" :
                          unit.unitStructure?.unitType === "team" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" :
                          unit.unitStructure?.unitType === "squad" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                          "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                        }`}>
                          {unit.unitStructure?.unitType || "Unknown"}
                        </span>
                      </div>

                      {/* Status */}
                      <div>
                        <UnitStatusBadgeContent status={unit.operational?.availability.status || (unit.active ? "available" : "inactive")} />
                      </div>

                      {/* Personnel */}
                      <div className="text-sm">
                        {unit.operational ? (
                          <div>
                            <div className="text-gray-900 dark:text-white font-medium">
                              {unit.operational.capacity.currentPersonnel}/{unit.operational.capacity.maxPersonnel}
                            </div>
                            <div className="text-xs text-gray-500">
                              {unit.operational.capacity.utilizationRate}% util
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </div>

                      {/* Performance */}
                      <div className="text-sm">
                        {unit.performance ? (
                          <div>
                            <div className="text-gray-900 dark:text-white font-medium">
                              {unit.performance.responseMetrics.averageResponseTime}m
                            </div>
                            <div className="text-xs text-gray-500">
                              {unit.performance.responseMetrics.slaCompliance}% SLA
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex justify-center gap-1">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewUnit(unit);
                            setShowPreview(true);
                          }}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          title="Edit Unit"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button 
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          title="Performance"
                        >
                          <PieChartIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Empty State */}
          {filteredUnits.length === 0 && (
            <div className="p-12 text-center">
              <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No units found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {searchTerm || filterStatus !== "all" || filterUnitType !== "all" 
                  ? "Try adjusting your search or filters" 
                  : "Get started by creating your first unit"}
              </p>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Create Unit
              </button>
            </div>
          )}
        </div>

        {/* Preview Modal */}
        <UnitPreviewModalContent
          previewUnit={previewUnit!}
          showPreview={showPreview}
          setShowPreview={setShowPreview}
        />
      </div>
    </div>
  );
};

export default UnitOverviewContent;
