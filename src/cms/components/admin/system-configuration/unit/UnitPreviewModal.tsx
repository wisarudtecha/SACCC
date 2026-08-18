// src/components/admin/system-configuration/unit/UnitPreviewModal.tsx
import React, { useState } from "react";
import { Activity, Building, Car, MapPin, Radio } from "lucide-react";
import { CloseIcon, PencilIcon, PieChartIcon } from "@/core/icons";
import type { EnhancedUnit } from "@/cms/types/unit";
import UnitStatusBadgeContent from "@/cms/components/admin/system-configuration/unit/UnitStatusBadge";

const UnitPreviewModalContent: React.FC<{
  previewUnit: EnhancedUnit;
  showPreview: boolean;
  setShowPreview: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({
  previewUnit,
  showPreview,
  setShowPreview
}) => {
  const [activeTab, setActiveTab] = useState("basic");

  if (!showPreview || !previewUnit) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Building className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{previewUnit.unitName}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {previewUnit.unitId} • {previewUnit.unitStructure?.unitType || "Unknown Type"}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setShowPreview(false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <CloseIcon className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[
            { key: "basic", label: "Basic Info", icon: Building },
            { key: "operational", label: "Operational", icon: Activity },
            { key: "performance", label: "Performance", icon: PieChartIcon },
            { key: "location", label: "Location", icon: MapPin }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "basic" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Unit ID</label>
                <div className="mt-1 text-sm text-gray-900 dark:text-white font-mono bg-white dark:bg-gray-900">
                  {previewUnit.unitId}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
                <div className="mt-1 text-sm text-gray-900 dark:text-white">{previewUnit.priority}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Plate Number</label>
                <div className="mt-1 text-sm text-gray-900 dark:text-white font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded">
                  {previewUnit.plateNo}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Province</label>
                <div className="mt-1 text-sm text-gray-900 dark:text-white">{previewUnit.provinceCode}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Active Status</label>
                <div className="mt-1">
                  <UnitStatusBadgeContent status={previewUnit.active ? "active" : "inactive"} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Login Status</label>
                <div className="mt-1">
                  <UnitStatusBadgeContent status={previewUnit.isLogin ? "online" : "offline"} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "operational" && previewUnit.operational && (
            <div className="space-y-6">
              {/* Capacity */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Capacity Management</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Personnel</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {previewUnit.operational.capacity.currentPersonnel}/{previewUnit.operational.capacity.maxPersonnel}
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${previewUnit.operational.capacity.utilizationRate}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {previewUnit.operational.capacity.utilizationRate}% utilization
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Availability</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                      {previewUnit.operational.availability.status}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Schedule: {previewUnit.operational.availability.schedule}
                    </div>
                    <div className="text-xs text-gray-500">
                      Next: {previewUnit.operational.availability.nextAvailable}
                    </div>
                  </div>
                </div>
              </div>

              {/* Equipment */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Equipment & Resources</h4>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Vehicles</div>
                    <div className="flex flex-wrap gap-2">
                      {previewUnit.operational.equipment.vehicles.map((vehicle, idx) => (
                        <span key={idx} className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                          <Car className="w-3 h-3 mr-1" />
                          {vehicle}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Specialized Equipment</div>
                    <div className="flex flex-wrap gap-2">
                      {previewUnit.operational.equipment.specializedEquipment.map((equipment, idx) => (
                        <span key={idx} className="inline-flex items-center px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs">
                          <Radio className="w-3 h-3 mr-1" />
                          {equipment}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Maintenance Status</div>
                    <UnitStatusBadgeContent status={previewUnit.operational.equipment.maintenanceStatus} />
                  </div>
                </div>
              </div>

              {/* Specializations */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Specializations</h4>
                <div className="flex flex-wrap gap-2">
                  {previewUnit.operational.specializations.map((spec, idx) => (
                    <span key={idx} className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "performance" && previewUnit.performance && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="text-green-700 dark:text-green-400 text-sm font-medium">Response Time</div>
                  <div className="text-2xl font-bold text-green-800 dark:text-green-300">
                    {previewUnit.performance.responseMetrics.averageResponseTime} min
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-500">average</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="text-blue-700 dark:text-blue-400 text-sm font-medium">SLA Compliance</div>
                  <div className="text-2xl font-bold text-blue-800 dark:text-blue-300">
                    {previewUnit.performance.responseMetrics.slaCompliance}%
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-500">compliance rate</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <div className="text-purple-700 dark:text-purple-400 text-sm font-medium">Cases Handled</div>
                  <div className="text-2xl font-bold text-purple-800 dark:text-purple-300">
                    {previewUnit.performance.responseMetrics.casesHandled}
                  </div>
                  <div className="text-xs text-purple-600 dark:text-purple-500">total cases</div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                  <div className="text-orange-700 dark:text-orange-400 text-sm font-medium">Success Rate</div>
                  <div className="text-2xl font-bold text-orange-800 dark:text-orange-300">
                    {previewUnit.performance.responseMetrics.successRate}%
                  </div>
                  <div className="text-xs text-orange-600 dark:text-orange-500">success rate</div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Workload Distribution</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {previewUnit.performance.workloadDistribution.currentCases}
                    </div>
                    <div className="text-xs text-gray-500">Current Cases</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {previewUnit.performance.workloadDistribution.averageCaseLoad}
                    </div>
                    <div className="text-xs text-gray-500">Average Load</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {previewUnit.performance.workloadDistribution.peakCapacity}
                    </div>
                    <div className="text-xs text-gray-500">Peak Capacity</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "location" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Latitude</label>
                  <div className="mt-1 text-sm text-gray-900 dark:text-white font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded">
                    {previewUnit.locLat.toFixed(6)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Longitude</label>
                  <div className="mt-1 text-sm text-gray-900 dark:text-white font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded">
                    {previewUnit.locLon.toFixed(6)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">GPS Accuracy</label>
                  <div className="mt-1 text-sm text-gray-900 dark:text-white">{previewUnit.locAccuracy}m</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Satellites</label>
                  <div className="mt-1 text-sm text-gray-900 dark:text-white">{previewUnit.locSatellites}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Provider</label>
                  <div className="mt-1 text-sm text-gray-900 dark:text-white">{previewUnit.locProvider}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Update</label>
                  <div className="mt-1 text-sm text-gray-900 dark:text-white">
                    {new Date(previewUnit.locLastUpdateTime).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Location Status</h4>
                  <div className="flex gap-2">
                    <UnitStatusBadgeContent status={previewUnit.isOutArea ? "out-of-area" : "in-area"} />
                    <UnitStatusBadgeContent status={previewUnit.isLogin ? "online" : "offline"} />
                  </div>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Speed: {previewUnit.locSpeed} km/h • Bearing: {previewUnit.locBearing}°
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button 
            onClick={() => setShowPreview(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2">
            <PencilIcon className="w-4 h-4" />
            Edit Unit
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnitPreviewModalContent;
