// /src/components/area/AreaManagement.tsx
import React, {
  useState,
  useMemo
} from "react";
// import { Activity, MapPin } from "lucide-react";
// import { GroupIcon, PieChartIcon } from "@/core/icons";
import AnalyticContent from "@/cms/components/area/Analytic";
import AreaContent from "@/cms/components/area/Area";
import AreaDesignerContent from "@/cms/components/area/AreaDesigner";
import CoverageContent from "@/cms/components/area/Coverage";
import OverviewContent from "@/cms/components/area/Overview";
import Tab from "@/core/components/ui/tab/Tab";
import type { TabItem } from "@/core/components/ui/tab/Tab";
import type { Area } from "@/cms/store/api/area";
import type {
  AreaCoverage,
  ResponseArea,
  ResponseMetrics
} from "@/cms/types/area";

const AreaManagementComponent: React.FC<{ areas: Area[] }> = (
  // { areas }
) => {
  // State Management
  const [showAreaDesigner, setShowAreaDesigner] = useState(false);

  // Mock Data (replace with actual API calls)
  const mockAreas: ResponseArea[] = useMemo(() => [
    {
      id: "1",
      orgId: "org1",
      areaCode: "BKK-001",
      areaName: { en: "Central Bangkok", th: "กรุงเทพกลาง" },
      geometry: {
        type: "Polygon",
        coordinates: [[100.5018, 13.7563], [100.5118, 13.7563], [100.5118, 13.7663], [100.5018, 13.7663]],
        bounds: { north: 13.7663, south: 13.7563, east: 100.5118, west: 100.5018 }
      },
      priority: 1,
      population: 850000,
      riskLevel: "high",
      responseTimeTarget: 8,
      active: true,
      metadata: { urbanDensity: 95, accessibilityScore: 85, trafficComplexity: 90 },
      createdAt: "2025-01-15T09:00:00Z",
      updatedAt: "2025-08-25T14:30:00Z"
    },
    {
      id: "2",
      orgId: "org1",
      areaCode: "BKK-002",
      areaName: { en: "Sukhumvit District", th: "เขตสุขุมวิท" },
      geometry: {
        type: "Polygon",
        coordinates: [[100.5518, 13.7363], [100.5718, 13.7363], [100.5718, 13.7563], [100.5518, 13.7563]],
        bounds: { north: 13.7563, south: 13.7363, east: 100.5718, west: 100.5518 }
      },
      priority: 2,
      population: 620000,
      riskLevel: "medium",
      responseTimeTarget: 12,
      active: true,
      metadata: { urbanDensity: 80, accessibilityScore: 75, trafficComplexity: 85 },
      createdAt: "2025-02-10T11:00:00Z",
      updatedAt: "2025-08-26T10:15:00Z"
    },
    {
      id: "3",
      orgId: "org1",
      areaCode: "BKK-003",
      areaName: { en: "Thonburi West", th: "ธนบุรีตะวันตก" },
      geometry: {
        type: "Circle",
        coordinates: [[100.4618, 13.7163]],
        radius: 3000,
        bounds: { north: 13.7433, south: 13.6893, east: 100.4988, west: 100.4248 }
      },
      priority: 3,
      population: 420000,
      riskLevel: "low",
      responseTimeTarget: 15,
      active: true,
      metadata: { urbanDensity: 60, accessibilityScore: 70, trafficComplexity: 65 },
      createdAt: "2025-03-05T08:30:00Z",
      updatedAt: "2025-08-27T09:45:00Z"
    }
  ], []);

  const mockCoverage: AreaCoverage[] = [
    {
      areaId: "1",
      unitId: "unit-001",
      unitName: "Emergency Response Team Alpha",
      primaryResponder: true,
      backupLevel: 0,
      averageResponseTime: 6.5,
      effectivenessScore: 95,
      capacity: { current: 8, maximum: 12, reserved: 2 }
    },
    {
      areaId: "1",
      unitId: "unit-002",
      unitName: "Mobile Support Unit Beta",
      primaryResponder: false,
      backupLevel: 1,
      averageResponseTime: 9.2,
      effectivenessScore: 88,
      capacity: { current: 5, maximum: 8, reserved: 1 }
    },
    {
      areaId: "2",
      unitId: "unit-003",
      unitName: "Rapid Response Gamma",
      primaryResponder: true,
      backupLevel: 0,
      averageResponseTime: 11.8,
      effectivenessScore: 92,
      capacity: { current: 6, maximum: 10, reserved: 1 }
    }
  ];

  const mockMetrics: ResponseMetrics[] = [
    {
      areaId: "1",
      totalCases: 145,
      averageResponseTime: 6.5,
      slaCompliance: 94,
      activeIncidents: 3,
      availableUnits: 13,
      demandTrend: "up"
    },
    {
      areaId: "2",
      totalCases: 98,
      averageResponseTime: 11.8,
      slaCompliance: 89,
      activeIncidents: 1,
      availableUnits: 6,
      demandTrend: "stable"
    },
    {
      areaId: "3",
      totalCases: 67,
      averageResponseTime: 13.2,
      slaCompliance: 91,
      activeIncidents: 0,
      availableUnits: 8,
      demandTrend: "down"
    }
  ];

  // Utility Functions
  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "critical": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "high": return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "low": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const formatTime = (minutes: number) => `${minutes}m`;
  const formatPercent = (value: number) => `${value}%`;

  // Helper function to safely convert number | string | undefined to number
  const getNumericValue = (value: number | string | undefined): number => {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const numericValue = parseFloat(value);
      return isNaN(numericValue) ? 0 : numericValue;
    }
    return 0; // fallback for undefined
  };

  // Calculate average response time safely
  const validResponseTimes = mockMetrics.map(m => getNumericValue(m.averageResponseTime)).filter(time => time > 0);
  const averageResponseTime = validResponseTimes.length > 0 ? validResponseTimes.reduce((acc, time) => acc + time, 0) / validResponseTimes.length : 0;
  // Calculate SLA compliance safely
  const validSlaCompliance = mockMetrics.map(m => getNumericValue(m.slaCompliance)).filter(sla => sla > 0);
  const averageSlaCompliance = validSlaCompliance.length > 0 ? validSlaCompliance.reduce((acc, sla) => acc + sla, 0) / validSlaCompliance.length : 0;

  const tabItem: TabItem[] = [
    {
      id: "overview",
      label: "Overview",
      // icon: <PieChartIcon className="w-4 h-4 mr-2" />,
      content: <OverviewContent
        // areas={areas}
        areas={mockAreas}
        avgResponseTime={averageResponseTime}
        avgSlaCompliance={averageSlaCompliance}
        metrics={mockMetrics}
        color={getRiskLevelColor}
        getNum={getNumericValue}
        percent={formatPercent}
        time={formatTime}
      />
    },
    {
      id: "areas",
      label: "Response Areas",
      // icon: <MapPin className="w-4 h-4 mr-2" />,
      content: <AreaContent
        // areas={areas}
        areas={mockAreas}
        avgResponseTime={averageResponseTime}
        avgSlaCompliance={averageSlaCompliance}
        coverages={mockCoverage}
        metrics={mockMetrics}
        color={getRiskLevelColor}
        percent={formatPercent}
        time={formatTime}
      />
    },
    {
      id: "coverage",
      label: "Unit Coverage",
      // icon: <GroupIcon className="w-4 h-4 mr-2" />,
      content: <CoverageContent
        // areas={areas}
        areas={mockAreas}
        coverages={mockCoverage}
        metrics={mockMetrics}
        color={getRiskLevelColor}
        percent={formatPercent}
        time={formatTime}
      />
    },
    {
      id: "analytics",
      label: "Analytics",
      // icon: <Activity className="w-4 h-4 mr-2" />,
      content: <AnalyticContent />
    },
  ];

  // Main Dashboard Render
  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
      <div className="mx-auto w-full">
        <Tab items={tabItem} variant="underline" />
      </div>

      {/* Area Designer Modal Placeholder */}
      {showAreaDesigner && (
        <AreaDesignerContent showAreaDesigner={setShowAreaDesigner} />
      )}
    </div>
  );
};

export default AreaManagementComponent;
