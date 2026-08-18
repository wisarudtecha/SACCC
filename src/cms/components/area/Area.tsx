// /src/components/area/Area.tsx
import React, { useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { GroupIcon, PencilIcon, TrashBinIcon } from "@/core/icons";
import Input from "@/core/components/form/input/InputField";
import Select from "@/core/components/form/Select";
import Badge from "@/core/components/ui/badge/Badge";
// import type { Area } from "@/cms/store/api/area";
import type {
  AreaCoverage,
  ResponseArea,
  ResponseMetrics
} from "@/cms/types/area";

const AreaContent: React.FC<{
  // areas: Area[],
  areas: ResponseArea[],
  avgResponseTime: number,
  avgSlaCompliance: number,
  coverages: AreaCoverage[],
  metrics: ResponseMetrics[],
  color: (value: string) => void,
  percent: (value: number) => string,
  time: (value: number) => string,
}> = ({
  areas,
  avgResponseTime,
  avgSlaCompliance,
  coverages,
  metrics,
  color,
  percent,
  time
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRiskLevel, setFilterRiskLevel] = useState<string>("all");

  // Filtered Areas
  const filteredAreas = useMemo(() => {
    return areas.filter(area => {
      const matchesSearch = area.areaName.en.toLowerCase().includes(searchTerm.toLowerCase()) ||
        area.areaName.th.includes(searchTerm) ||
        area.areaCode.toLowerCase().includes(searchTerm.toLowerCase());
      // const matchesSearch = area.districtEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      //   area.districtTh.includes(searchTerm) ||
      //   area.provinceEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      //   area.provinceTh.includes(searchTerm) ||
      //   area.countryEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      //   area.countryTh.includes(searchTerm);
      const matchesFilter = filterRiskLevel === "all" || area.riskLevel === filterRiskLevel;
      // const matchesFilter = filterRiskLevel === "all";
      return matchesSearch && matchesFilter;
    });
  }, [searchTerm, filterRiskLevel, areas]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Input
                placeholder="Search areas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select
              value={filterRiskLevel}
              onChange={(value) => setFilterRiskLevel(value)}
              options={[
                { value: "all", label: "All Risk Levels" },
                { value: "critical", label: "Critical" },
                { value: "high", label: "High" },
                { value: "medium", label: "Medium" },
                { value: "low", label: "Low" },
              ]}
              className="cursor-pointer"
            />
          </div>

          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {filteredAreas.length} of {areas.length} areas
          </div>
        </div>
      </div>

      {/* Areas Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAreas.map((area) => {
          const metric = metrics.find(m => m.areaId === area.id);
          const coverage = coverages.filter(c => c.areaId === area.id);
          
          return (
            <div key={area.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4 cursor-default">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {area.areaName.en}
                      {/* {area.districtTh || area.districtEn}{" "} */}
                      {/* {area.provinceTh || area.provinceEn}{" "} */}
                      {/* {area.countryTh || area.countryEn} */}
                    </h3>

                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {area.areaCode} • {area.areaName.th}
                    </p>
                  </div>

                  <Badge className={`capitalize ${color(area.riskLevel)}`} size="sm">
                    {area.riskLevel}
                  </Badge>
                </div>

                <div className="space-y-3 mb-4 cursor-default">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Population</span>
                    <span className="text-gray-900 dark:text-white font-medium">{area.population.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Response Target</span>
                    <span className="text-gray-900 dark:text-white font-medium">{time(area.responseTimeTarget)}</span>
                  </div>
                  {metric && (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Avg Response</span>
                        <span className={`font-medium ${
                          avgResponseTime <= area.responseTimeTarget 
                            ? "text-green-500 dark:text-green-400" 
                            : "text-red-500 dark:text-red-400"
                        }`}>
                          {time(avgResponseTime)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">SLA Compliance</span>
                        <span className="text-gray-900 dark:text-white font-medium">{percent(Math.round(avgSlaCompliance))}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 cursor-default">
                    <GroupIcon className="w-4 h-4" />
                    {coverage.length} units assigned
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      <Eye className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                    <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      <PencilIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                    <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      <TrashBinIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AreaContent;
