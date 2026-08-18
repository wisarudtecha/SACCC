// /src/components/area/Overview.tsx
import React, { useCallback, useState } from "react";
import { ChevronDown, ChevronLeft, MapPin, Target, TrendingUp } from "lucide-react";
import { AlertHexaIcon, GroupIcon, TimeIcon } from "@/core/icons";
import MetricsView from "@/core/components/admin/MetricsView";
import Badge from "@/core/components/ui/badge/Badge";
// import type { Area } from "@/cms/store/api/area";
import type {
  ResponseArea,
  ResponseMetrics
} from "@/cms/types/area";

const OverviewContent: React.FC<{
  // areas: Area[],
  areas: ResponseArea[],
  avgResponseTime: number,
  avgSlaCompliance: number,
  metrics: ResponseMetrics[],
  color: (value: string) => void,
  getNum: (value: number | string | undefined) => number,
  percent: (value: number) => string,
  time: (value: number) => string,
}> = ({
  areas,
  avgResponseTime,
  avgSlaCompliance,
  metrics,
  color,
  getNum,
  percent,
  time
}) => {
  const [expandedMetrics, setExpandedMetrics] = useState<string[]>([]);

  const toggleMetricsExpanded = useCallback((areaId: string) => {
    setExpandedMetrics(prev => 
      prev.includes(areaId) 
        ? prev.filter(id => id !== areaId)
        : [...prev, areaId]
    );
  }, []);

  const mockMetrics: ResponseMetrics = {
    totalCases: areas.length || 0,
    averageResponseTime: time(avgResponseTime) || "0m",
    slaCompliance: percent(Math.round(avgSlaCompliance)) || "0%",
    activeIncidents: metrics.reduce((acc, m) => acc + (m?.activeIncidents || 0), 0) || 0,
  };

  const attrMetrics = [
    { key: "totalCases", title: "Total Areas", icon: MapPin, color: "blue", className: "text-blue-600" },
    { key: "averageResponseTime", title: "Avg Response Time", icon: TimeIcon, color: "green", className: "text-green-600" },
    { key: "slaCompliance", title: "SLA Compliance", icon: Target, color: "yellow", className: "text-yellow-600" },
    { key: "activeIncidents", title: "Active Incidents", icon: AlertHexaIcon, color: "orange", className: "text-orange-600" },
  ];

  return (
    <>
      {/* Summary Cards */}
      <MetricsView metrics={mockMetrics} attrMetrics={attrMetrics} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Performance Cards */}
        <div className="lg:col-span-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 cursor-default">Area Performance</h2>
          <div className="space-y-4">
            {areas.map((
              // area: Area,
              area: ResponseArea,
              key
            ) => {
              const metric = metrics.find((m: ResponseMetrics) => m.areaId === area.id);
              const isExpanded = expandedMetrics.includes(area.id);
              
              return (
                <div key={key} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="p-6">
                    <div className="xl:flex items-center justify-between">
                      <div className="flex items-center gap-4 mb-4 xl:mb-0">
                        <button
                          onClick={() => toggleMetricsExpanded(area.id)}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                          ) : (
                            <ChevronLeft className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                          )}
                        </button>
                        <div className="cursor-default">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {area.areaName.en}
                            {/* {area.districtTh || area.districtEn}{" "} */}
                            {/* {area.provinceTh || area.provinceEn}{" "} */}
                            {/* {area.countryTh || area.countryEn} */}
                          </h3>

                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {area.areaCode} • Population: {area.population?.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 cursor-default">
                        <Badge className={`capitalize ${color(area.riskLevel)}`} size="sm">
                          {area.riskLevel}
                        </Badge>
                       
                        {metric && (
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <TimeIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" /> 
                              <span className="text-gray-600 dark:text-gray-300">{time(getNum(metric.averageResponseTime))}</span> 
                            </div>
                            <div className="flex items-center gap-1">
                              <Target className="w-4 h-4 text-gray-500 dark:text-gray-400" /> 
                              <span className="text-gray-600 dark:text-gray-300">{percent(getNum(metric.slaCompliance))}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <GroupIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                              <span className="text-gray-600 dark:text-gray-300">{metric.availableUnits || 0}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {isExpanded && metric && (
                      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 cursor-default">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Total Cases</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">{metric.totalCases || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Active Incidents</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">{metric.activeIncidents || 0}</p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Response Target</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">{time(area.responseTimeTarget)}</p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Demand Trend</p>
                            <div className="flex items-center gap-1">
                              <TrendingUp className={`w-4 h-4 ${
                                metric.demandTrend === "up" ? "text-red-500 dark:text-red-400" : 
                                metric.demandTrend === "down" ? "text-green-500 dark:text-green-400" : "text-gray-400 dark:text-gray-500"
                              }`} />
                              <span className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                                {metric.demandTrend || "stable"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default OverviewContent;
