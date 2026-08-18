// src/cms/components/crm/products/ProductDashboard.tsx
import { useEffect, useState } from "react";
import { Package, Boxes, ShoppingCart, Clock, Tag, CalendarDays, Users, AlertTriangle, TrendingUp, Activity, ClipboardList } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/core/components/ui/card/Card";
import { Skeleton } from "@/core/components/ui/loading/LoadingSystem";
import { useWebSocket } from "@/core/components/websocket/websocket";
import { useTranslation } from "@/core/hooks/useTranslation";
import { formatNumberWithComma, formatPrice, formatPriceWithCompact, getRequestStatus } from "@/cms/utils/productHelper";
import type { JSONArray, JSONObject } from "@/core/types/dashboard.ts";
import Badge, { BadgeColor } from "@/core/components/ui/badge/Badge";
// import Button from "@/core/components/ui/button/Button";
import ProductDashboardV1 from "@/cms/components/crm/products/ProductDashboardV1";
import ProductDashboardV2 from "@/cms/components/crm/products/ProductDashboardV2";

// Mocked: no WebSocket message type currently carries recent-service-activity
// data (see ORDER_SUMMARY/PERIODS/TOPTEN/INSIGHT, DASHBOARD_GROWTH/SUMMARY_ALL/
// REVENUE/INVENTORY_ALERT below — none fits). Replace once a backend message exists.
// const recentServices = [
//   {
//     service: "Network Maintenance",
//     agent: "Michael T.",
//     date: "2026-05-15",
//     status: "Completed",
//   },
//   {
//     service: "Server Installation",
//     agent: "Sarah K.",
//     date: "2026-05-14",
//     status: "In Progress",
//   },
//   {
//     service: "CCTV Inspection",
//     agent: "David P.",
//     date: "2026-05-13",
//     status: "Pending",
//   },
// ];

const MetricsCardsSkeleton = () => (
  <>
    {Array.from({ length: 4 }).map((_, index) => (
      <Card
        key={index}
        className="rounded-2xl border border-gray-200 dark:border-gray-700"
      >
        <div className="p-0 flex items-start justify-between">
          <div className="w-full">
            <Skeleton height={14} width="50%" />
            <Skeleton height={30} width="40%" className="mt-2" />
            <Skeleton height={20} width={64} rounded className="mt-3" />
          </div>
          <Skeleton width={44} height={44} className="shrink-0" />
        </div>
      </Card>
    ))}
  </>
);

const ModuleOverviewSkeleton = () => (
  <>
    {Array.from({ length: 5 }).map((_, index) => (
      <div
        key={index}
        className="flex items-center justify-between p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
      >
        <div className="flex items-center gap-4 w-full">
          <Skeleton width={36} height={36} className="shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton height={14} width="50%" />
            <Skeleton height={10} width="30%" />
          </div>
        </div>
        <Skeleton height={24} width={40} />
      </div>
    ))}
  </>
);

const TopOrderedSkeleton = () => (
  <>
    {Array.from({ length: 4 }).map((_, index) => (
      <div
        key={index}
        className="flex items-center justify-between border border-gray-200 dark:border-gray-700 rounded-2xl p-4"
      >
        <div className="flex items-center gap-2 w-full">
          <Skeleton width={28} height={28} rounded className="shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton height={14} width="60%" />
            <Skeleton height={10} width="40%" />
          </div>
        </div>
        <div className="text-right space-y-2">
          <Skeleton height={18} width={64} />
          <Skeleton height={10} width={48} />
        </div>
      </div>
    ))}
  </>
);

const InventoryAlertSkeleton = () => (
  <>
    <Skeleton height={40} width="50%" rounded />
    <Skeleton height={40} width="60%" rounded />
  </>
);

const RevenueSkeleton = () => (
  <>
    <div className="flex items-center justify-center py-3">
      <Skeleton width={176} height={176} rounded />
    </div>
    <div className="space-y-4 mt-0">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index}>
          <div className="flex items-center justify-between text-sm mb-1">
            <Skeleton height={12} width={60} />
            <Skeleton height={12} width={32} />
          </div>
          <Skeleton height={8} width="100%" />
        </div>
      ))}
    </div>
  </>
);

// Turns a DASHBOARD_GROWTH key (e.g. "sparePart") into a display title ("Spare Part").
const humanizeMetricKey = (key: string) =>
  key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, char => char.toUpperCase());

const metricIconMap: Record<string, LucideIcon> = {
  product: Package,
  sparePart: Boxes,
  ordering: ShoppingCart,
  pending: Clock,
};

const metricOrder = ["product", "sparePart", "ordering", "pending"];

// Known keys get a specific icon; unrecognized keys (future backend additions)
// are matched by keyword, falling back to a generic tag icon.
const getMetricIcon = (key: string): LucideIcon => {
  if (metricIconMap[key]) {
    return metricIconMap[key];
  }

  const normalized = key.toLowerCase();
  if (normalized.includes("part")) return Boxes;
  if (normalized.includes("product")) return Package;
  if (normalized.includes("order")) return ShoppingCart;
  if (normalized.includes("pend") || normalized.includes("wait")) return Clock;
  if (normalized.includes("customer")) return Users;
  if (normalized.includes("appointment")) return CalendarDays;
  if (normalized.includes("cancel")) return AlertTriangle;
  if (normalized.includes("complete") || normalized.includes("grow")) return TrendingUp;

  return Tag;
};

const moduleIconMap: Record<string, LucideIcon> = {
  productStock: Activity,
  sparePartStock: ClipboardList,
  customers: Users,
  appointments: CalendarDays,
};

const moduleOrder = ["productStock", "sparePartStock", "customers", "appointments"];

const getModuleIcon = (key: string): LucideIcon => {
  if (moduleIconMap[key]) {
    return moduleIconMap[key];
  }

  const normalized = key.toLowerCase();
  if (normalized.includes("product")) return Package;
  if (normalized.includes("part")) return Boxes;
  if (normalized.includes("stock")) return Activity;
  if (normalized.includes("customer")) return Users;
  if (normalized.includes("appointment")) return CalendarDays;
  if (normalized.includes("order")) return ShoppingCart;
  if (normalized.includes("pend") || normalized.includes("wait")) return Clock;

  return Tag;
};

const ProductDashboard = () => {
  const { language, t } = useTranslation();

  // Translates a dynamic backend key (e.g. "sparePart") via i18n; if no
  // translation exists yet for that key, falls back to a humanized version
  // of the raw key so newly-added backend keys still render something readable.
  const translateOrHumanize = (key: string, translationKey: string) => {
    const translated = t(translationKey);
    return translated === translationKey ? humanizeMetricKey(key) : translated;
  };

  const { connectionState, isConnected, onMessage, send } = useWebSocket();

  const [isMounted, setIsMounted] = useState(false);
  const [
    version,
    // setVersion
  ] = useState(3);

  // ===================================================================
  // WebSocket State Management
  // ===================================================================
  const [dashboardGrowth, setDashboardGrowth] = useState<JSONObject>();
  // Captured but not yet surfaced in any card — no UI slot designed for these yet.
  // ORDER_SUMMARY was previously read here too, until metricsCards moved to
  // deriving its values/growth entirely from DASHBOARD_GROWTH instead.
  const [, setDashboardOrderInsight] = useState<JSONObject>();
  const [, setDashboardOrderPeriods] = useState<JSONObject>();
  const [, setDashboardOrderSummary] = useState<JSONObject>();
  const [dashboardOrderTop, setDashboardOrderTop] = useState<JSONObject>();
  const [dashboardRevenue, setDashboardRevenue] = useState<JSONObject>();
  const [dashboardSummaryAll, setDashboardSummaryAll] = useState<JSONObject>();
  const [dashboardInventoryAlert, setDashboardInventoryAlert] = useState<JSONObject>();

  // ===================================================================
  // MetricWidget
  // ===================================================================
  // const metricsClassName = "text-gray-900 dark:text-white";
  // const metricsClassNameTotal = "text-green-500 dark:text-green-400";
  // const metricsIconSize = 24;

  const dashboardGrowthJson = dashboardGrowth?.additionalJson as JSONObject;
  const dashboardGrowthData = dashboardGrowthJson?.data as JSONObject;

  const dashboardSummaryAllJson = dashboardSummaryAll?.additionalJson as JSONObject;
  const dashboardSummaryAllData = dashboardSummaryAllJson?.data as JSONObject;

  const metricsCards = Object.entries(dashboardGrowthData || {})
    .map(([key, entry]) => {
      const main = (entry as JSONObject)?.main as JSONObject;
      const growthRate = main?.growthRate as number;
      const total = (main?.total as number) ?? 0;

      return {
        key,
        title: translateOrHumanize(key, `productDashboard.metrics.titles.${key}`),
        value: total,
        growth: `${growthRate > 0 && "+" || ""}${growthRate as unknown as string || "0"}%`,
        description: "",
        icon: getMetricIcon(key)
      };
    })
    .sort((a, b) => {
      const rankA = metricOrder.indexOf(a.key);
      const rankB = metricOrder.indexOf(b.key);
      return (rankA === -1 ? metricOrder.length : rankA) - (rankB === -1 ? metricOrder.length : rankB);
    });

  const dashboardInventoryAlertJson = dashboardInventoryAlert?.additionalJson as JSONObject;
  const dashboardInventoryAlertData = dashboardInventoryAlertJson?.data as JSONObject;

  const dashboardInventoryAlertApproval = dashboardInventoryAlertData?.approval as JSONArray;
  const dashboardInventoryAlertApprovalStatus = getRequestStatus(dashboardInventoryAlertApproval?.length as number || 0);
  const dashboardInventoryAlertApprovalStatusColor = dashboardInventoryAlertApprovalStatus?.variant as BadgeColor;

  // getStockStatus classifies a single item's remaining stock quantity, where
  // MORE means healthier (green). Here we're counting how many distinct parts
  // are already flagged as low-stock, where MORE means worse — the opposite
  // direction. getRequestStatus already has the right polarity (more count =
  // more severe), so it's reused here instead, same as the approval badge above.
  const dashboardInventoryAlertParts = dashboardInventoryAlertData?.parts as JSONArray;
  const dashboardInventoryAlertPartsStatus = getRequestStatus(dashboardInventoryAlertParts?.length as number || 0);
  const dashboardInventoryAlertPartsStatusColor = dashboardInventoryAlertPartsStatus?.variant as BadgeColor;

  // ===================================================================
  // Module Overview
  // ===================================================================
  const modules = Object.entries(dashboardSummaryAllData || {})
    .map(([key, entry]) => ({
      key,
      title: translateOrHumanize(key, `productDashboard.moduleOverview.titles.${key}`),
      icon: getModuleIcon(key),
      total: ((entry as JSONObject)?.totalActive as number) ?? 0,
    }))
    .sort((a, b) => {
      const rankA = moduleOrder.indexOf(a.key);
      const rankB = moduleOrder.indexOf(b.key);
      return (rankA === -1 ? moduleOrder.length : rankA) - (rankB === -1 ? moduleOrder.length : rankB);
    });

  // ===================================================================
  // Top Ordered (ORDER_TOP)
  // ===================================================================
  const dashboardOrderTopJson = dashboardOrderTop?.additionalJson as JSONObject;
  const dashboardOrderTopData = dashboardOrderTopJson?.data as JSONObject;
  const dashboardOrderTopByParts = ((dashboardOrderTopData?.byParts as JSONArray) || [])
    .slice()
    .sort((a, b) => (((a as JSONObject)?.rank as number) ?? 0) - (((b as JSONObject)?.rank as number) ?? 0));

  const topProducts = dashboardOrderTopByParts.map(item => {
    const obj = item as JSONObject;
    const partMeta = obj?.partMeta as JSONObject;
    return {
      name: ((language === "th" ? partMeta?.th : partMeta?.en) as string) || "",
      requests: (obj?.quantity as number) ?? 0,
      price: (partMeta?.price as number) ?? 0,
    };
  });

  // ===================================================================
  // Estimated Revenue (DASHBOARD_REVENUE)
  // ===================================================================
  const dashboardRevenueJson = dashboardRevenue?.additionalJson as JSONObject;
  const dashboardRevenueData = dashboardRevenueJson?.data as JSONObject;
  const dashboardRevenueSummary = dashboardRevenueData?.summary as JSONObject;
  const dashboardRevenueItems = (dashboardRevenueData?.items as JSONArray) || [];

  const revenueTotal = (dashboardRevenueSummary?.target as number) ?? 0;
  const hasRevenueTotal = !!revenueTotal;
  const revenuePartsPercent = (
    (dashboardRevenueItems.find(i => (i as JSONObject)?.type === "parts") as JSONObject)?.percentRate as number
  ) ?? 0;
  const revenueProductsPercent = (
    (dashboardRevenueItems.find(i => (i as JSONObject)?.type === "products") as JSONObject)?.percentRate as number
  ) ?? 0;

  // ===================================================================
  // WebSocket Message Handler - Updated for new structure
  // ===================================================================
  useEffect(() => {
    const listener = onMessage(message => {
      try {
        const messageJson = typeof message === "string" ? JSON.parse(message) : message;
        const data = messageJson?.data || messageJson;

        if (!data.additionalJson) {
          return;
        }

        const additionalJson = data.additionalJson;
        const messageType = additionalJson.type;

        switch (messageType) {
          case "ORDER_SUMMARY":
            setDashboardOrderSummary(data);
            break;

          case "ORDER_PERIODS":
            setDashboardOrderPeriods(data);
            break;

          case "ORDER_TOP":
            setDashboardOrderTop(data);
            break;

          case "ORDER_INSIGHT":
            setDashboardOrderInsight(data);
            break;

          case "DASHBOARD_GROWTH":
            setDashboardGrowth(data);
            break;

          case "DASHBOARD_SUMMARY_ALL":
            setDashboardSummaryAll(data);
            break;

          case "DASHBOARD_REVENUE":
            setDashboardRevenue(data);
            break;

          case "DASHBOARD_INVENTORY_ALERT":
            setDashboardInventoryAlert(data);
            break;

          default:
        }
      }
      catch (error) {
        console.error("❌ Error processing WebSocket message:", error);
      }
    });

    return () => {
      listener();
    };
  }, [onMessage]);

  useEffect(() => {
    const getProfile = () => {
      const profile = localStorage.getItem("profile") || sessionStorage.getItem("profile");
      if (profile) {
        try {
          return JSON.parse(profile);
        }
        catch (err) {
          console.error("Failed to parse profile:", err);
        }
      }
      return null;
    };

    const sender = () => {
      if ((isConnected || connectionState === "connected") && !isMounted) {
        const profile = getProfile();
        send({ "EVENT": "DASHBOARD", orgId: profile?.orgId || "", username: profile?.username || "" });
        setIsMounted(true);
      }
    }

    sender();
  });

  const isMetricsLoading = !dashboardGrowth;
  const isModulesLoading = !dashboardSummaryAll;
  const isTopOrderedLoading = !dashboardOrderTop;
  const isInventoryAlertLoading = !dashboardInventoryAlert;
  const isRevenueLoading = !dashboardRevenue;

  return (
    <div className="p-0 pb-6 bg-gray-50 dark:bg-gray-900 min-h-screen space-y-6 cursor-default">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-600 dark:text-gray-300">
            {t("productDashboard.header.title")}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t("productDashboard.header.subtitle")}
          </p>
        </div>

        {/* <div className="flex items-center gap-3">
          {version === 3 && (
            <>
              <Button variant="outline" size="sm" onClick={() => setVersion(2)}>v2</Button>
              <Button variant="outline" size="sm" onClick={() => setVersion(1)}>v1</Button>
            </>
          )}
          {version === 2 && (
            <>
              <Button variant="outline" size="sm" onClick={() => setVersion(3)}>v3</Button>
              <Button variant="outline" size="sm" onClick={() => setVersion(1)}>v1</Button>
            </>
          )}
          {version === 1 && (
            <>
              <Button variant="outline" size="sm" onClick={() => setVersion(3)}>v3</Button>
              <Button variant="outline" size="sm" onClick={() => setVersion(2)}>v2</Button>
            </>
          )}
          <Button variant="primary" size="sm">
            Export Report
          </Button>
        </div> */}
      </div>

      {version === 3 ? (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {isMetricsLoading ? <MetricsCardsSkeleton /> : metricsCards.map((item, index) => (
              <Card
                key={index}
                className="rounded-2xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              >
                <div className="p-0 flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.title}</p>
                    <h2 className="text-3xl font-bold mt-2 text-gray-600 dark:text-gray-300">{formatNumberWithComma(item.value)}</h2>

                    <div className="flex items-center gap-2 mt-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          item.growth.includes("+")
                            ? "bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-300"
                            : "bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-300"
                        }`}
                      >
                        {item.growth}
                      </span>

                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {t("productDashboard.metrics.fromLastMonth")}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                      {item.description}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-blue-100 dark:bg-blue-800">
                    <item.icon className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Main Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Side */}
            <div className="xl:col-span-2 space-y-6">
              {/* Module Overview */}
              <Card className="rounded-2xl border border-gray-200 dark:border-gray-700">
                <div className="p-0">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-300">
                        {t("productDashboard.moduleOverview.title")}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {t("productDashboard.moduleOverview.subtitle")}
                      </p>
                    </div>

                    <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {isModulesLoading ? <ModuleOverviewSkeleton /> : modules.map((module, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-800">
                            <module.icon className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                          </div>

                          <div>
                            <p className="font-medium text-sm text-gray-500 dark:text-gray-400">{module.title}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              {t("productDashboard.moduleOverview.activeRecords")}
                            </p>
                          </div>
                        </div>

                        <div className="text-xl font-bold text-gray-600 dark:text-gray-300">{formatNumberWithComma(module.total)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Top Products */}
              <Card className="rounded-2xl border border-gray-200 dark:border-gray-700">
                <div className="p-0">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-300">
                        {t("productDashboard.topOrdered.title")}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {t("productDashboard.topOrdered.subtitle")}
                      </p>
                    </div>

                    <Package className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                  </div>

                  <div className="space-y-4">
                    {isTopOrderedLoading ? <TopOrderedSkeleton /> : topProducts.map((product, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between border border-gray-200 dark:border-gray-700 rounded-2xl p-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-600 text-white text-sm font-semibold">
                              {index + 1}
                            </span>

                            <p className="font-semibold text-gray-600 dark:text-gray-300">{product.name}</p>
                          </div>

                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            {t("productDashboard.topOrdered.orderedTimes", { count: formatNumberWithComma(product.requests) })}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-600 dark:text-gray-300">{formatPrice(product.price, "THB", "th-TH", 0)}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{t("productDashboard.topOrdered.unitPrice")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Side */}
            <div className="space-y-6">
              {/* Alert */}
              <Card className="rounded-2xl border border-gray-200 dark:border-gray-700">
                <div className="p-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-600 dark:text-gray-300">
                        {t("productDashboard.inventoryAlert.title")}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {t("productDashboard.inventoryAlert.subtitle")}
                      </p>
                    </div>

                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                  </div>

                  <div className="mt-5 space-y-4">
                    {isInventoryAlertLoading ? <InventoryAlertSkeleton /> : (
                      <>
                        <Badge className="w-full p-4! text-sm item-start! justify-start! rounded-2xl!" color={dashboardInventoryAlertPartsStatusColor}>
                          {t("productDashboard.inventoryAlert.partsBelowMinimum", { count: formatNumberWithComma(dashboardInventoryAlertParts?.length || 0) })}
                        </Badge>

                        <Badge className="w-full p-4! text-sm item-start! justify-start! rounded-2xl!" color={dashboardInventoryAlertApprovalStatusColor}>
                          {t("productDashboard.inventoryAlert.purchaseRequestsWaiting", { count: formatNumberWithComma(dashboardInventoryAlertApproval?.length || 0) })}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              </Card>

              {/* Revenue */}
              <Card className="rounded-2xl border border-gray-200 dark:border-gray-700">
                <div className="p-0">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-600 dark:text-gray-300">
                        {t("productDashboard.revenue.title")}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {t("productDashboard.revenue.subtitle")}
                      </p>
                    </div>

                    <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-300" />
                  </div>

                  {isRevenueLoading ? <RevenueSkeleton /> : (
                    <>
                      <div className="flex items-center justify-center py-3">
                        <div className={`w-48 h-48 rounded-full border-14 border-blue-200 ${hasRevenueTotal ? "border-t-blue-600" : ""} rotate-45 flex items-center justify-center`}>
                          <div className="-rotate-45 text-center">
                            <p className="text-sm text-gray-400 dark:text-gray-500">{t("productDashboard.revenue.thisMonth")}</p>
                            <h2 className="text-4xl font-bold text-gray-500 dark:text-gray-300">{formatPriceWithCompact(revenueTotal, "THB", "th-TH", 0)}</h2>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 mt-0">
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-500 dark:text-gray-400">Parts</span>
                            <span className="text-gray-600 dark:text-gray-300">{revenuePartsPercent}%</span>
                          </div>
                          <div className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 dark:bg-blue-400 rounded-full" style={{ width: `${revenuePartsPercent}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-500 dark:text-gray-400">{t("productDashboard.revenue.products")}</span>
                            <span className="text-gray-600 dark:text-gray-300">{revenueProductsPercent}%</span>
                          </div>
                          <div className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 dark:bg-green-400 rounded-full" style={{ width: `${revenueProductsPercent}%` }} />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </Card>

              {/* Recent Services */}
              {/* <Card className="rounded-2xl border border-gray-200 dark:border-gray-700">
                <div className="p-0">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-600 dark:text-gray-300">
                        Recent Services
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Latest service records
                      </p>
                    </div>

                    <Wrench className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                  </div>

                  <div className="space-y-4">
                    {recentServices.map((service, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 dark:border-gray-700 rounded-2xl p-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-600 dark:text-gray-300">{service.service}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              Agent: {service.agent}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                              {service.date}
                            </p>
                          </div>

                          <span
                            className={`text-xs px-3 py-1 rounded-full font-medium ${
                              service.status === "Completed"
                                ? "bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200"
                                : service.status === "In Progress"
                                ? "bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-200"
                                : "bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200"
                            }`}
                          >
                            {service.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card> */}
            </div>
          </div>
        </>
      ) : version === 2 ? (
        <ProductDashboardV2 />
      ) : (
        <ProductDashboardV1 />
      )}
    </div>
  );
}

export default ProductDashboard;
