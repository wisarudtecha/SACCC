// src/components/ServiceDashboard.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import {
  Cctv,
  Dam,
  LayoutGrid,
  Puzzle,
  // RotateCcw,
  // Settings
} from "lucide-react";
import { AnimatedNumber, AnimatedPercentage } from "@/core/components/ui/animation/AnimatedNumber";
import { LoadingSpinner, ProgressBar, Skeleton } from "@/core/components/ui/loading/LoadingSystem";
import { useWebSocket } from "@/core/components/websocket/websocket";
import { useRealtimeDateTime } from "@/core/hooks/useRealtimeDateTime";
import { useTranslation } from "@/core/hooks/useTranslation";
import ExportReportModal from "@/cms/components/crm/products/ExportReportModal";

type JSONValue = string | number | boolean | null | JSONArray | JSONObject;
type JSONArray = Array<JSONValue>;
type JSONObject = { [key: string]: JSONValue };
type ViewMode = "monthly" | "daily";

interface MonthlyRangeResult {
  monthsTh: string[];
  monthsEn: string[];
  records: JSONObject[];
  series: {
    name: string;
    data: number[]
  }[];
  latestMonthStats: number[];
}

/**
 * Recursively search for a key in nested objects/arrays.
 * @param obj - The object or array to search
 * @param targetKey - The key to look for
 * @returns The value if found, otherwise undefined
 */
const findKeyDeep = (obj: JSONObject | JSONArray, targetKey: string): JSONValue | undefined => {
  if (Array.isArray(obj)) {
    // Loop through array items
    for (const item of obj) {
      if (typeof item === "object" && item !== null) {
        const result = findKeyDeep(item, targetKey);
        if (result !== undefined) {
          return result;
        }
      }
    }
  }
  else {
    // Loop through object keys
    for (const key in obj) {
      if (key === targetKey) {
        return obj[key];
      }
      const value = obj[key];
      if (typeof value === "object" && value !== null) {
        const result = findKeyDeep(value, targetKey);
        if (result !== undefined) {
          return result;
        }
      }
    }
  }
}

/**
 * Find key inside objects of an array, return index and val
 * @param arr - The array to search
 * @param searchKey - The key that want to find (e.g. "g1_en")
 * @returns An object containing the index and val, or undefined if not found
 */
const findKeyInArray = (arr: JSONArray, searchKey: string): { index: number; val: JSONValue } | undefined => {
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    if (typeof item === "object" && item !== null) {
      if (searchKey in item) {
        return { index: i, val: (item as JSONObject)["val"] };
      }
    }
  }
  return undefined; // not found
}

/**
 * Filter monthly data by defined range and start month,
 * returning monthsTh, monthsEn, and series values.
 *
 * @param data - The DASHBOARD_MONTHLY object
 * @param rangeMonths - Number of months to include (default = 6)
 * @param startMonth - Starting month (1-12). Default is current month.
 * @param startYear - Optional year for startMonth. Default is current year.
 * @param labels - Object with label names for series (optional, default = EN values)
 */
const filterMonthlyRangeWithSeries = (
  data: JSONObject,
  rangeMonths: number = 6,
  startMonth?: number,
  startYear?: number,
  labels = {
    complete: "Complete",
    inProgress: "In Progress",
    new: "New"
  }
): MonthlyRangeResult => {
  // Access data from additionalJson.data instead of Data
  const additionalJson = data["additionalJson"] as JSONObject;
  const rawData = additionalJson["data"] as JSONArray;

  // Extract only month records (skip "Total")
  const monthlyData = rawData.filter(item => {
    if (typeof item === "object" && item !== null) {
      return Object.keys(item).some(k => /^m\d+_en$/.test(k));
    }
    return false;
  }) as JSONObject[];

  // Parse date + extract labels
  const parsedData = monthlyData.map((item: JSONObject) => {
    const enKey = Object.keys(item).find(k => k.endsWith("_en"))!;
    const thKey = Object.keys(item).find(k => k.endsWith("_th"))!;
    const monthYearEn = item[enKey] as string;
    const monthYearTh = item[thKey] as string;
    const date = new Date(monthYearEn);
    return { date, obj: item, monthYearEn, monthYearTh };
  });

  // Sort ascending
  parsedData.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Determine anchor point
  const today = new Date();
  const startYearResolved = startYear ?? today.getFullYear();
  const startMonthResolved = startMonth ?? (today.getMonth() + 1);
  const anchorDate = new Date(startYearResolved, startMonthResolved - 1, 1);

  // Cutoff date (N months back)
  const cutoff = new Date(
    anchorDate.getFullYear(),
    anchorDate.getMonth() - (rangeMonths - 1),
    1
  );

  // Get filtered range
  const filtered = parsedData.filter(entry => entry.date >= cutoff && entry.date <= anchorDate);

  // Build arrays
  const monthsTh = filtered.map(entry => entry.monthYearTh);
  const monthsEn = filtered.map(entry => entry.monthYearEn);
  const valuesComplete = filtered.map(entry => (entry.obj["complete"] as number) ?? 0);
  const valuesInProgress = filtered.map(entry => (entry.obj["inprogress"] as number) ?? 0);
  const valuesNew = filtered.map(entry => (entry.obj["new"] as number) ?? 0);

  // Construct series
  const series = [
    { name: labels.complete, data: valuesComplete },
    { name: labels.inProgress, data: valuesInProgress },
    { name: labels.new, data: valuesNew },
  ];

  // Latest month stats (last element of filtered)
  const latest = filtered.length > 0 ? filtered[filtered.length - 1].obj : {};
  const latestMonthStats = [
    (latest["complete"] as number) ?? 0,
    (latest["inprogress"] as number) ?? 0,
    (latest["new"] as number) ?? 0,
  ];

  return { monthsTh, monthsEn, records: filtered.map(e => e.obj), series, latestMonthStats };
}

const getLatestDailyStats = (data: JSONObject): number[] => {
  const additionalJson = data["additionalJson"] as JSONObject;
  const rawData = additionalJson?.["data"] as JSONArray;

  if (!Array.isArray(rawData) || rawData.length === 0) {
    return [0, 0, 0];
  }

  const dailyRecords = rawData.filter(item => {
    if (typeof item === "object" && item !== null) {
      return Object.keys(item).some(k => /^m\d+_en$/.test(k));
    }
    return false;
  }) as JSONObject[];

  if (dailyRecords.length === 0) {
    return [0, 0, 0];
  }

  const latest = dailyRecords[dailyRecords.length - 1];

  return [
    (latest["complete"] as number) ?? 0,
    (latest["inprogress"] as number) ?? 0,
    (latest["new"] as number) ?? 0,
  ];
};

const transformDailyToSeries = (
  data: JSONObject,
  labels = {
    complete: "Complete",
    inProgress: "In Progress",
    new: "New"
  }
) => {
  const additionalJson = data["additionalJson"] as JSONObject;
  const rawData = additionalJson?.["data"] as JSONArray;

  if (!Array.isArray(rawData)) {
    return {
      categories: [],
      series: []
    };
  }

  // filter เฉพาะ m1 - m7
  const dailyRecords = rawData.filter(item => {
    if (typeof item === "object" && item !== null) {
      return Object.keys(item).some(k => /^m\d+_en$/.test(k));
    }
    return false;
  }) as JSONObject[];

  const categoriesTh: string[] = [];
  const categoriesEn: string[] = [];

  const complete: number[] = [];
  const inprogress: number[] = [];
  const newData: number[] = [];

  dailyRecords.forEach(item => {
    const enKey = Object.keys(item).find(k => k.endsWith("_en"))!;
    const thKey = Object.keys(item).find(k => k.endsWith("_th"))!;

    categoriesEn.push(item[enKey] as string);
    categoriesTh.push(item[thKey] as string);

    complete.push(Math.max(0, (item["complete"] as number) ?? 0));
    inprogress.push(Math.max(0, (item["inprogress"] as number) ?? 0));
    newData.push(Math.max(0, (item["new"] as number) ?? 0));
  });

  return {
    categoriesTh,
    categoriesEn,
    series: [
      { name: labels.complete, data: complete },
      { name: labels.inProgress, data: inprogress },
      { name: labels.new, data: newData },
    ]
  };
};

const ServiceDashboard: React.FC = () => {
  const dateTime = useRealtimeDateTime(
    // {
    //   weekday: "short",
    //   year: "numeric",
    //   month: "short",
    //   hour: "2-digit",
    //   minute: "2-digit",
    //   second: "2-digit",
    // }
  );
  const { language } = useTranslation();
  const { connectionState, isConnected, onMessage, send } = useWebSocket();
  const [isMounted, setIsMounted] = useState(false);

  const exportRef = useRef<HTMLDivElement>(null);
  const exportBtnRef = useRef<HTMLButtonElement>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  const handleExport = async (type: "pdf" | "image") => {
    setShowExportModal(false);

    // Hide export button so it doesn't appear in the capture
    if (exportBtnRef.current) exportBtnRef.current.style.visibility = "hidden";
    await new Promise(resolve => setTimeout(resolve, 350));

    const element = exportRef.current;
    if (!element) return;

    const { toPng } = await import("html-to-image");
    const dataUrl = await toPng(element, { pixelRatio: 2, backgroundColor: "#ffffff" });

    // Restore export button
    if (exportBtnRef.current) exportBtnRef.current.style.visibility = "visible";

    if (type === "image") {
      const link = document.createElement("a");
      link.download = "service-dashboard.png";
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const { jsPDF } = await import("jspdf");
      const img = new Image();
      img.src = dataUrl;
      await new Promise(resolve => { img.onload = resolve; });
      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [img.width / 2, img.height / 2] });
      pdf.addImage(dataUrl, "PNG", 0, 0, img.width / 2, img.height / 2);
      pdf.save("service-dashboard.pdf");
    }
  };

  // ===================================================================
  // Mockup State Management
  // ===================================================================
  const DASHBOARD_CASE: JSONObject = {
    EVENT: "DASHBOARD",
    eventType: "hidden",
    additionalJson: {
      type: "CASE-SUMMARY",
      title_en: "Case Summary",
      title_th: "สรุปเคส",
      data: [
        {
          "total_en": "Total",
          "total_th": "ทั้งหมด",
          "val": 0
        },
        {
          "g1_en": "Censor",
          "g1_th": "เซ็นเซอร์",
          "val": 0
        },
        {
          "g2_en": "CCTV",
          "g2_th": "กล้อง",
          "val": 0
        },
        {
          "g3_en": "Traffic",
          "g3_th": "การจราจร",
          "val": 0
        }
      ]
    }
  };
  // const DASHBOARD_CASE: JSONObject = {
  //   EVENT: "DASHBOARD",
  //   eventType: "hidden",
  //   additionalJson: {
  //     type: "CASE-SUMMARY",
  //     title_en: "Case Summary",
  //     title_th: "สรุปเคส",
  //     data: [
  //       {
  //         "total_en": "Total",
  //         "total_th": "ทั้งหมด",
  //         "val": 376
  //       },
  //       {
  //         "g1_en": "Censor",
  //         "g1_th": "เซ็นเซอร์",
  //         "val": 188
  //       },
  //       {
  //         "g2_en": "CCTV",
  //         "g2_th": "กล้อง",
  //         "val": 112
  //       },
  //       {
  //         "g3_en": "Traffic",
  //         "g3_th": "การจราจร",
  //         "val": 76
  //       }
  //     ]
  //   }
  // };

  const DASHBOARD_SLA: JSONObject = {
    EVENT: "DASHBOARD",
    eventType: "hidden",
    additionalJson: {
      type: "SLA-PERFORMANCE",
      title_en: "SLA Performance",
      title_th: "ประสิทธิภาพการทำงาน",
      data: [
        {
        "total_en": "Total",
        "total_th": "ทั้งหมด",
        "val": 0
        },
        {
          "inSLA_en": "InSLA",
          "inSLA_th": "ปฏิบัติตาม SLA",
          "val": 0
        },
        {
          "overSLA_en": "OverSLA",
          "overSLA_th": "เกินกำหนด SLA",
          "val": 0
        },
        {
          "percentage_inSLA_en": "InSLA",
          "percentage_inSLA_th": "ปฏิบัติตาม SLA",
          "val": "0%",
          "formular_en": "(Number of tasks completed ON TIME / Total number of tasks) * 100",
          "formular_th": "(จำนวนงานที่ทำเสร็จทันเวลา / จำนวนงานทั้งหมด) x 100"
        },
        {
          "avg_respose_time_en": "Average Response Time",
          "avg_respose_time_th": "เวลาเฉลี่ยในการแก้ปัญหา",
          "val": 0,
          "unit_en": "min.",
          "unit_th": " นาที"
        }
      ]
    }
  };
  // const DASHBOARD_SLA: JSONObject = {
  //   EVENT: "DASHBOARD",
  //   eventType: "hidden",
  //   additionalJson: {
  //     type: "SLA-PERFORMANCE",
  //     title_en: "SLA Performance",
  //     title_th: "ประสิทธิภาพการทำงาน",
  //     data: [
  //       {
  //       "total_en": "Total",
  //       "total_th": "ทั้งหมด",
  //       "val": 376
  //       },
  //       {
  //         "inSLA_en": "InSLA",
  //         "inSLA_th": "ปฏิบัติตาม SLA",
  //         "val": 309
  //       },
  //       {
  //         "overSLA_en": "OverSLA",
  //         "overSLA_th": "เกินกำหนด SLA",
  //         "val": 67
  //       },
  //       {
  //         "percentage_inSLA_en": "InSLA",
  //         "percentage_inSLA_th": "ปฏิบัติตาม SLA",
  //         "val": "82%",
  //         "formular_en": "(Number of tasks completed ON TIME / Total number of tasks) * 100",
  //         "formular_th": "(จำนวนงานที่ทำเสร็จทันเวลา / จำนวนงานทั้งหมด) x 100"
  //       },
  //       {
  //         "avg_respose_time_en": "Average Response Time",
  //         "avg_respose_time_th": "เวลาเฉลี่ยในการแก้ปัญหา",
  //         "val": 45,
  //         "unit_en": "min.",
  //         "unit_th": " นาที"
  //       }
  //     ]
  //   }
  // };

  // const DASHBOARD_MONTHLY: JSONObject = {
  //   EVENT: "DASHBOARD",
  //   eventType: "hidden",
  //   additionalJson: {
  //     type: "CASE-MONTHLY-SUMMARY",
  //     title_en: "Case in Monthly Summary",
  //     title_th: "สรุปคำสั่งงานประจำเดือน",
  //     data: [
  //       { "total_en": "Total", "total_th": "ทั้งหมด", "new": 0, "inprogress": 0, "complete": 0 },
  //       { "m1_en": "Jan 2025", "m1_th": "ม.ค. 2568", "new": 0, "inprogress": 0, "complete": 0 },
  //       { "m2_en": "Feb 2025", "m2_th": "ก.พ. 2568", "new": 0, "inprogress": 0, "complete": 0 },
  //       { "m3_en": "Mar 2025", "m3_th": "มี.ค. 2568", "new": 0, "inprogress": 0, "complete": 0 },
  //       { "m4_en": "Apr 2025", "m4_th": "เม.ย. 2568", "new": 0, "inprogress": 0, "complete": 0 },
  //       { "m5_en": "May 2025", "m5_th": "พ.ค. 2568", "new": 0, "inprogress": 0, "complete": 0 },
  //       { "m6_en": "June 2025", "m6_th": "มิ.ย. 2568", "new": 0, "inprogress": 0, "complete": 0 },
  //       { "m7_en": "Jul 2025", "m7_th": "ก.ค. 2568", "new": 0, "inprogress": 0, "complete": 0 },
  //       { "m8_en": "Aug 2025", "m8_th": "ส.ค. 2568", "new": 0, "inprogress": 0, "complete": 0 },
  //       { "m9_en": "Sep 2025", "m9_th": "ก.ย. 2568", "new": 0, "inprogress": 0, "complete": 0 },
  //       { "m10_en": "Oct 2025", "m10_th": "ต.ค. 2568", "new": 0, "inprogress": 0, "complete": 0 },
  //       { "m11_en": "Nov 2025", "m11_th": "พ.ย. 2568", "new": 0, "inprogress": 0, "complete": 0 },
  //       { "m12_en": "Dec 2025", "m12_th": "ธ.ค. 2568", "new": 0, "inprogress": 0, "complete": 0 }
  //     ]
  //   }
  // };
  // const DASHBOARD_MONTHLY: JSONObject = {
  //   EVENT: "DASHBOARD",
  //   eventType: "hidden",
  //   additionalJson: {
  //     type: "CASE-MONTHLY-SUMMARY",
  //     title_en: "Case in Monthly Summary",
  //     title_th: "สรุปคำสั่งงานประจำเดือน",
  //     data: [
  //       { "total_en": "Total", "total_th": "ทั้งหมด", "new": 0, "inprogress": 0, "complete": 0 },
  //       { "m1_en": "Jan 2025", "m1_th": "ม.ค. 2568", "new": 0, "inprogress": 0, "complete": 0 },
  //       { "m2_en": "Feb 2025", "m2_th": "ก.พ. 2568", "new": 0, "inprogress": 0, "complete": 0 },
  //       { "m3_en": "Mar 2025", "m3_th": "มี.ค. 2568", "new": 0, "inprogress": 0, "complete": 0 },
  //       { "m4_en": "Apr 2025", "m4_th": "เม.ย. 2568", "new": 0, "inprogress": 0, "complete": 0 },
  //       { "m5_en": "May 2025", "m5_th": "พ.ค. 2568", "new": 0, "inprogress": 0, "complete": 0 },
  //       { "m6_en": "June 2025", "m6_th": "มิ.ย. 2568", "new": 0, "inprogress": 0, "complete": 0 },
  //       { "m7_en": "Jul 2025", "m7_th": "ก.ค. 2568", "new": 0, "inprogress": 0, "complete": 0 },
  //       { "m8_en": "Aug 2025", "m8_th": "ส.ค. 2568", "new": 0, "inprogress": 0, "complete": 0 },
  //       { "m9_en": "Sep 2025", "m9_th": "ก.ย. 2568", "new": 0, "inprogress": 0, "complete": 0 },
  //       { "m10_en": "Oct 2025", "m10_th": "ต.ค. 2568", "new": 0, "inprogress": 0, "complete": 0 },
  //       { "m11_en": "Nov 2025", "m11_th": "พ.ย. 2568", "new": 0, "inprogress": 0, "complete": 0 },
  //       { "m12_en": "Dec 2025", "m12_th": "ธ.ค. 2568", "new": 0, "inprogress": 0, "complete": 0 }
  //     ]
  //   }
  // };

  // ===================================================================
  // WebSocket State Management
  // ===================================================================
  const [viewMode, setViewMode] = useState<ViewMode>("daily");

  const [dashboardCase, setDashboardCase] = useState<JSONObject>({
    EVENT: "DASHBOARD",
    eventType: "hidden",
    additionalJson: {
      type: "CASE-SUMMARY",
      title_en: "Case Summary",
      title_th: "สรุปเคส",
      // data: []
      data: (DASHBOARD_CASE.additionalJson as JSONObject)?.data
    }
  });

  const [dashboardSLA, setDashboardSLA] = useState<JSONObject>({
    EVENT: "DASHBOARD",
    eventType: "hidden",
    additionalJson: {
      type: "SLA-PERFORMANCE",
      title_en: "SLA Performance",
      title_th: "ประสิทธิภาพการทำงาน",
      // data: []
      data: (DASHBOARD_SLA.additionalJson as JSONObject)?.data
    }
  });

  const [
    dashboardMonthly,
    setDashboardMonthly
  ] = useState<JSONObject>({
    EVENT: "DASHBOARD-MONTHLY",
    eventType: "hidden",
    additionalJson: {
      type: "CASE-MONTHLY-SUMMARY",
      title_en: "Case in Monthly Summary",
      title_th: "สรุปคำสั่งงานประจำเดือน",
      data: []
      // data: (DASHBOARD_MONTHLY.additionalJson as JSONObject)?.data
    }
  });

  const [dashboardDaily, setDashboardDaily] = useState<JSONObject>({
    EVENT: "DASHBOARD-DAILY",
    eventType: "hidden",
    additionalJson: {
      type: "CASE-DAILY-SUMMARY",
      title_en: "Work Order in Daily Summary",
      title_th: "สรุปคำสั่งงานประจำวัน",
      data: []
    }
  });

  // ===================================================================
  // General
  // ===================================================================
  const colors = ["#05DF72", "#51A2FF", "#FDC700"]; // Green, Blue, Yellow
  const fontFamily = "Outfit, sans-serif";

  // Access title from additionalJson
  const dashboardCaseJson = dashboardCase.additionalJson as JSONObject;
  const pageTitle = language === "th" ? dashboardCaseJson?.title_th : dashboardCaseJson?.title_en || "";

  const dashboardSLAJson = dashboardSLA.additionalJson as JSONObject;
  const labels = {
    complete: language === "th" ? "เสร็จสิ้น" : "Complete",
    inProgress: language === "th" ? "กำลังดำเนินการ" : "In Progress",
    new: language === "th" ? "งานใหม่" : "New",
    compliance: language === "th" ? findKeyDeep(dashboardSLAJson, "inSLA_th") || "ปฏิบัติตาม" : findKeyDeep(dashboardSLAJson, "inSLA_en") || "Compliance",
    overdue: language === "th" ? findKeyDeep(dashboardSLAJson, "overSLA_th") || "เกินกำหนด" : findKeyDeep(dashboardSLAJson, "overSLA_en") || "Overdue"
  }
  
  // ===================================================================
  // MetricWidget
  // ===================================================================
  const metricsClassName = "text-gray-900 dark:text-white";
  const metricsClassNameTotal = "text-green-500 dark:text-green-400";
  const metricsIconSize = 24;

  // Access data from additionalJson.data
  const caseData = dashboardCaseJson.data as JSONArray;

  const metricsCards = [
    {
      name: language === "th" ? findKeyDeep(caseData, "total_th") : findKeyDeep(caseData, "total_en") || "",
      data: (findKeyInArray(caseData, "total_th")?.val || findKeyInArray(caseData, "total_en")?.val || 0) as number,
      icon: <LayoutGrid className={metricsClassNameTotal} size={metricsIconSize} />,
      className: metricsClassNameTotal
    },
    {
      name: language === "th" ? findKeyDeep(caseData, "g1_th") : findKeyDeep(caseData, "g1_en") || "",
      data: (findKeyInArray(caseData, "g1_th")?.val || findKeyInArray(caseData, "g1_en")?.val || 0) as number,
      icon: <Dam className={metricsClassName} size={metricsIconSize} />,
      className: metricsClassName
    },
    {
      name: language === "th" ? findKeyDeep(caseData, "g2_th") : findKeyDeep(caseData, "g2_en") || "",
      data: (findKeyInArray(caseData, "g2_th")?.val || findKeyInArray(caseData, "g2_en")?.val || 0) as number,
      icon: <Cctv className={metricsClassName} size={metricsIconSize} />,
      className: metricsClassName
    },
    {
      name: language === "th" ? findKeyDeep(caseData, "g3_th") : findKeyDeep(caseData, "g3_en") || "",
      data: (findKeyInArray(caseData, "g3_th")?.val || findKeyInArray(caseData, "g3_en")?.val || 0) as number,
      icon: <Puzzle className={metricsClassName} size={metricsIconSize} />,
      className: metricsClassName
    }
  ];

  // ===================================================================
  // ChartWidget
  // ===================================================================
  const chartWidgetHeight = 580;

  // const monthlyOfCases = filterMonthlyRangeWithSeries(
  //   dashboardMonthly,
  //   6,
  //   undefined,
  //   undefined,
  //   {
  //     complete: labels.complete,
  //     inProgress: labels.inProgress,
  //     new: labels.new
  //   }
  // );

  // const monthsTh = monthlyOfCases.monthsTh;
  // const monthsEn = monthlyOfCases.monthsEn;
  // const seriesOfMonthlyCases = monthlyOfCases.series;
  // const seriesOfCaseStatusOverview = monthlyOfCases.latestMonthStats;
  const seriesOfCaseStatusOverview = getLatestDailyStats(dashboardDaily);

  // const dailyOfCases = transformDailyToSeries(
  //   dashboardDaily,
  //   {
  //     complete: labels.complete,
  //     inProgress: labels.inProgress,
  //     new: labels.new
  //   }
  // );

  // const monthsTh = dailyOfCases.categoriesTh;
  // const monthsEn = dailyOfCases.categoriesEn;
  // const seriesOfMonthlyCases = dailyOfCases.series;

  const seriesOfMonthlyCasesRate = seriesOfCaseStatusOverview.map(item => {
    const total = seriesOfCaseStatusOverview.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
    return total > 0 ? (item / total) * 100 : 0;
  });

  const chartData = useMemo(() => {
    if (viewMode === "daily") {
      const daily = transformDailyToSeries(dashboardDaily, {
        complete: labels.complete,
        inProgress: labels.inProgress,
        new: labels.new
      });

      return {
        categoriesTh: daily.categoriesTh,
        categoriesEn: daily.categoriesEn,
        series: daily.series,
        title: (dashboardDaily.additionalJson as JSONObject)?.[
          language === "th" ? "title_th" : "title_en"
        ]
      };
    }

    // default = monthly
    const monthly = filterMonthlyRangeWithSeries(
      dashboardMonthly,
      6,
      undefined,
      undefined,
      {
        complete: labels.complete,
        inProgress: labels.inProgress,
        new: labels.new
      }
    );

    return {
      categoriesTh: monthly.monthsTh,
      categoriesEn: monthly.monthsEn,
      series: monthly.series,
      title: (dashboardMonthly.additionalJson as JSONObject)?.[
        language === "th" ? "title_th" : "title_en"
      ]
    };
  }, [viewMode, dashboardDaily, dashboardMonthly, labels.complete, labels.inProgress, labels.new, language]);

  const optionsOfMonthlyCases: ApexOptions = {
    colors: colors,
    chart: {
      fontFamily: fontFamily,
      stacked: true,
      toolbar: {
        show: false
      }
    },
    dataLabels: {
      enabled: true
    },
    fill: {
      opacity: 0.6
    },
    grid: {
      yaxis: {
        lines: {
          show: false
        }
      }
    },
    legend: {
      fontFamily: fontFamily,
      horizontalAlign: "right",
      position: "top",
      show: true
    },
    plotOptions: {
      bar: {
        columnWidth: "39%",
        borderRadius: 0,
        borderRadiusApplication: "end",
        horizontal: false,
        dataLabels: {
          total: {
            enabled: true,
            offsetY: -2
          }
        }
      }
    },
    stroke: {
      colors: ["transparent"],
      show: true,
      width: 0
    },
    xaxis: {
      // categories: language === "th" ? monthsTh : monthsEn,
      categories: language === "th" ? chartData.categoriesTh : chartData.categoriesEn,
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      },
      labels: {
        formatter: val => {
          if (val.split) {
            return val.split(" ");
          }
          return "";
        }
      }
    },
    yaxis: {
      title: {
        text: undefined
      }
    },
    tooltip: {
      x: {
        show: false
      },
      y: {
        formatter: (val: number) => `${val}`
      }
    }
  };

  // const dashboardMonthlyJson = dashboardMonthly.additionalJson as JSONObject;
  // const monthlyCases = {
  //   name: language === "th" ? dashboardMonthlyJson?.title_th : dashboardMonthlyJson?.title_en || "",
  //   data: {
  //     options: optionsOfMonthlyCases,
  //     series: seriesOfMonthlyCases
  //   }
  // };

  // const dashboardDailyJson = dashboardDaily.additionalJson as JSONObject;

  const monthlyCases = {
    name: chartData.title || "",
    data: {
      options: optionsOfMonthlyCases,
      series: chartData.series
    }
  };
  // const monthlyCases = {
  //   name: language === "th"
  //     ? dashboardDailyJson?.title_th
  //     : dashboardDailyJson?.title_en || "",
  //   data: {
  //     options: optionsOfMonthlyCases,
  //     series: seriesOfMonthlyCases
  //   }
  // };

  // ===================================================================
  // SLAMonitorWidget
  // ===================================================================
  const slaData = dashboardSLAJson.data as JSONArray;
  const slaTotal = (findKeyInArray(slaData, "total_th")?.val || findKeyInArray(slaData, "total_en")?.val || 0) as number;
  const slaMet = (findKeyInArray(slaData, "inSLA_th")?.val || findKeyInArray(slaData, "inSLA_en")?.val || 0) as number;
  const slaOverdue = (findKeyInArray(slaData, "overSLA_th")?.val || findKeyInArray(slaData, "overSLA_en")?.val || 0) as number;
  const slaMetRate = slaTotal > 0 ? (slaMet / slaTotal * 100) : 0;
  const slaOverdueRate = slaTotal > 0 ? (slaOverdue / slaTotal * 100) : 0;

  const slaPerformance = {
    name: language === "th" ? dashboardSLAJson?.title_th : dashboardSLAJson?.title_en || "",
    data: {
      total: {
        name: language === "th" ? findKeyDeep(slaData, "percentage_inSLA_th") : findKeyDeep(slaData, "percentage_inSLA_en") || "",
        // data: (findKeyInArray(slaData, "percentage_inSLA_th")?.val || findKeyInArray(slaData, "percentage_inSLA_en")?.val || "0") as string,
        data: slaMet
      },
      met: {
        name: language === "th" ? findKeyDeep(slaData, "inSLA_th") : findKeyDeep(slaData, "inSLA_en") || "",
        data: slaMetRate,
      },
      overdue: {
        name: language === "th" ? findKeyDeep(slaData, "overSLA_th") : findKeyDeep(slaData, "overSLA_en") || "",
        data: slaOverdueRate,
      },
      avg: {
        name: language === "th" ? findKeyDeep(slaData, "avg_respose_time_th") : findKeyDeep(slaData, "avg_respose_time_en") || "",
        data: (findKeyInArray(slaData, "avg_respose_time_th")?.val || findKeyInArray(slaData, "avg_respose_time_en")?.val || 0) as number,
        timeUnit: language === "th" ? findKeyDeep(slaData, "unit_th") : findKeyDeep(slaData, "unit_en") || findKeyDeep(slaData, "unit") || "",
      }
    }
  };

  // ===================================================================
  // ProgressCircularWidget
  // ===================================================================
  const progressCircularWidgetHeight = 145;

  const optionsOfCaseStatusOverview: ApexOptions = {
    colors: colors,
    chart: {
      fontFamily: fontFamily,
      sparkline: {
        enabled: true
      }
    },
    fill: {
      colors: colors,
      type: "solid"
    },
    labels: [
      labels.complete,
      labels.inProgress,
      labels.new
    ],
    legend: {
      show: true
    },
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,
            total: {
              label: language === "th" ? "รวม" : "Total",
              show: true
            }
          },
          size: "75%",
        }
      }
    },
    stroke: {
      lineCap: "round",
      show: false
    },
    tooltip: {
      enabled: false
    }
  };

  // ===================================================================
  // Case Status Overview
  // ===================================================================
  const caseStatusOverview = {
    name: language === "th" ? "ภาพรวมสถานะเคส" : "Case Status Overview",
    data: {
      options: optionsOfCaseStatusOverview,
      series: seriesOfCaseStatusOverview
    }
  };

  // ===================================================================
  // Action Button
  // ===================================================================
  // const actionButtonClassName = "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 p-2 text-gray-600 dark:text-gray-300 rounded";
  // const actionButtonIconSize = 20;

  // ===================================================================
  // WebSocket Message Handler - Updated for new structure
  // ===================================================================
  useEffect(() => {
    const listener = onMessage(message => {
      try {
        // console.log("🚀 ~ WebSocket message received:", message);
        
        // const data = typeof message === "string" ? JSON.parse(message) : message;
        const messageJson = typeof message === "string" ? JSON.parse(message) : message;
        const data = messageJson?.data || messageJson;
        
        // Check if additionalJson exists
        if (!data.additionalJson) {
          // console.warn("⚠️ Message missing additionalJson:", data);
          return;
        }

        const additionalJson = data.additionalJson;
        const messageType = additionalJson.type;

        // Handle different message types based on additionalJson.type
        switch (messageType) {
          case "CASE-SUMMARY":
            console.log("📊 Updating DASHBOARD_CASE data");
            setDashboardCase(data);
            break;
            
          case "SLA-PERFORMANCE":
            console.log("📈 Updating DASHBOARD_SLA data");
            setDashboardSLA(data);
            break;
            
          case "CASE-MONTHLY-SUMMARY":
            console.log("📅 Updating DASHBOARD_MONTHLY data");
            setDashboardMonthly(data);
            break;
          
          case "CASE-DAILY-SUMMARY":
            console.log("📆 Updating DASHBOARD_DAILY data");
            setDashboardDaily(data);
            break;
            
          default:
            // console.warn("⚠️ Unknown message type:", messageType);
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
      const storage = localStorage || sessionStorage;
      const profile = storage.getItem("profile");
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

    const sender = async () => {
      // console.log("🚀 ~ sender ~ isConnected:", isConnected);
      // console.log("🚀 ~ sender ~ connectionState:", connectionState);
      // console.log("🚀 ~ sender ~ isMounted:", isMounted);
      if ((isConnected || connectionState === "connected") && !isMounted) {
        const profile = await getProfile();
        send({ "EVENT": "DASHBOARD", orgId: profile?.orgId || "", username: profile?.username || "" });
        setIsMounted(true);
        // console.log("🚀 ~ ServiceDashboard ~ sender:", profile);
      }
    }

    // return () => {
    //   sender();
    // };

    sender();
  });

  return (
    <div ref={exportRef} className="bg-gray-50 dark:bg-gray-900 cursor-default">
      <ExportReportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-semibold text-2xl text-gray-900 dark:text-white">
          {pageTitle as string}
        </h1>
        {/*
        <div className="flex gap-2">
          <button className={actionButtonClassName || ""}>
            <Settings size={actionButtonIconSize || 0} />
          </button>
          <button className={actionButtonClassName || ""}>
            <RotateCcw size={actionButtonIconSize || 0} />
          </button>
        </div>
        */}

        <div className="flex gap-2 mb-2">
          <span className="px-3 py-1 text-gray-900 dark:text-white">
            {dateTime}
          </span>

          <button
            onClick={() => setViewMode("monthly")}
            className={`px-3 py-1 rounded ${
              viewMode === "monthly"
                ? "bg-blue-500 text-white"
                : "bg-gray-400"
            }`}
          >
            {language === "th" ? "รายเดือน" : "Monthly"}
          </button>
          <button
            onClick={() => setViewMode("daily")}
            className={`px-3 py-1 rounded ${
              viewMode === "daily"
                ? "bg-blue-500 text-white"
                : "bg-gray-400"
            }`}
          >
            {language === "th" ? "รายวัน" : "Daily"}
          </button>

          <button
            ref={exportBtnRef}
            onClick={() => setShowExportModal(true)}
            className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
          >
            {language === "th" ? "ส่งออกรายงาน" : "Export Report"}
          </button>
        </div>
      </div>

      <div className="gap-4 grid grid-cols-1 xl:grid-cols-4">
        <div className="col-span-3 h-full flex flex-col gap-4">
          {/**
            * Overview Cases
            * Widget Name: MetricWidget
            * Chart Type: Metric (Custom)
            */}
          <div className="space-y-4">
            <div className="gap-4 grid grid-cols-1 xl:grid-cols-4">
              {metricsCards.map((item, index) => (
                <div key={`metricsCardSummary-${index}`} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex gap-4 p-4 items-center justify-center rounded-lg">
                  {(item?.name || item?.data) &&
                    item?.icon || 
                    <Skeleton className="mb-2" height={24} width={24} />
                  }
                  <div>
                    {item?.name ? (
                      <div className={`${item?.className as string || ""} text-sm`}>{item.name as string || ""}</div>
                    ) : (
                      <Skeleton className="mb-2" height={20} width={120} />
                    )}
                    {item?.data !== null && item?.data !== undefined ? (
                      <AnimatedNumber
                        value={item.data || 0}
                        className={`${item?.className as string || ""} text-3xl font-bold`}
                        duration={1.2}
                      />
                    ) : (
                      <Skeleton height={36} width={60} />
                    )}
                    {/* <div className={`${item?.className as string || ""} text-3xl font-bold`}>{item?.data || 0}</div> */}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/**
            * Monthly Cases
            * Widget Name: ChartWidget
            * Chart Type: Bar
            */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 gap-2 p-2 rounded-lg relative">
              <div className="absolute flex items-center justify-between left-4 top-4 mb-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {monthlyCases?.name as string || ""}
                </h3>
              </div>
              <Chart options={monthlyCases?.data?.options || []} series={monthlyCases?.data?.series || []} type="bar" height={chartWidgetHeight || 0} />
              {/*
              {monthlyCases?.data?.series?.reduce((acc, curr) => acc + curr.data.reduce((sum, val) => sum + val, 0), 0) ? (
                <Chart options={monthlyCases?.data?.options || []} series={monthlyCases?.data?.series || []} type="bar" height={chartWidgetHeight || 0} />
              ) : (
                <div className="flex items-center justify-center" style={{height: `${(chartWidgetHeight + 20) || 0}px`}}>
                  <LoadingSpinner className="h-full" color="gray" size="xl" />
                </div>
              )}
              */}
            </div>
          </div>
        </div>

        <div className="col-span-1 h-full flex flex-col gap-4">
          {/**
            * SLA Performance
            * Widget Name: SLAMonitorWidget
            * Chart Type: ProgressBar (Custom)
            */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 gap-2 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {slaPerformance?.name ? (
                    slaPerformance.name as string || ""
                  ) : (
                    <Skeleton height={20} width={80} />
                  )}
                </h3>
              </div>
              <div className="space-y-4">
                <div className="text-center">
                  {slaPerformance?.data?.total?.data !== null && slaPerformance?.data?.total?.data !== undefined ? (
                    <AnimatedNumber
                      value={slaPerformance.data.total.data || 0}
                      className="text-green-600 dark:text-green-300 text-2xl font-bold"
                      duration={1.5}
                    />
                  ) : (
                    <div className="flex items-center justify-center mb-2">
                      <Skeleton height={32} width={60} />
                    </div>
                  )}
                  {/* <div className="text-green-600 dark:text-green-300 text-2xl font-bold">{slaPerformance.data.total.data || "0"}%</div> */}
                  <div className="text-gray-500 dark:text-gray-400 text-xs">
                    {slaPerformance?.data?.total?.name ? (
                      slaPerformance.data.total.name as string || ""
                    ) : (
                      <div className="flex items-center justify-center mb-2">
                        <Skeleton height={15} width={100} />
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    {slaPerformance?.data?.met?.name ? (
                      <span className="text-gray-600 dark:text-gray-300 text-sm">{slaPerformance.data.met.name as string || ""}</span>
                    ) : (
                      <Skeleton height={20} width={80} />
                    )}
                    {slaPerformance?.data?.met?.data !== null && slaPerformance?.data?.met?.data !== undefined ? (
                      <AnimatedPercentage
                        value={slaPerformance.data.met.data || 0}
                        className="text-green-600 dark:text-green-300 text-sm font-medium"
                        duration={1.5}
                      />
                    ) : (
                      <Skeleton height={20} width={40} />
                    )}
                    {/* <span className="text-green-600 dark:text-green-300 text-sm font-medium">{slaPerformance.data.met.data || "0"}%</span> */}
                  </div>
                  <div className="bg-gray-200 dark:bg-gray-700 h-2 rounded-full w-full">
                    <div
                      className="bg-green-500 dark:bg-green-400 h-2 rounded-full"
                      style={{width:`${slaPerformance.data.met.data <= 100 && slaPerformance.data.met.data|| "0"}%`}}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between">
                    {slaPerformance?.data?.overdue?.name ? (
                      <span className="text-gray-600 dark:text-gray-300 text-sm">{slaPerformance.data.overdue.name as string || ""}</span>
                    ) : (
                      <Skeleton height={20} width={80} />
                    )}
                    {slaPerformance?.data?.overdue?.data !== null && slaPerformance?.data?.overdue?.data !== undefined ? (
                      <AnimatedPercentage
                        value={slaPerformance.data.overdue.data || 0}
                        className="text-red-600 dark:text-red-300 text-sm font-medium"
                        duration={1.5}
                      />
                    ) : (
                      <Skeleton height={20} width={40} />
                    )}
                    {/* <span className="text-red-600 dark:text-red-300 text-sm font-medium">{slaPerformance?.data?.overdue?.data || "0"}%</span> */}
                  </div>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 text-center">
                  <div className="text-gray-900 dark:text-white text-lg font-bold">
                    {slaPerformance?.data?.avg?.data !== null && slaPerformance?.data?.avg?.data !== undefined ? (
                      <AnimatedNumber
                        value={slaPerformance.data.avg.data || 0}
                        duration={1.5}
                      />
                    ) : (
                      <div className="flex items-center justify-center mb-2">
                        <Skeleton height={28} width={60} />
                      </div>
                    )}
                    {/* {slaPerformance.data.avg.data || 0} */}
                    {slaPerformance?.data?.avg?.timeUnit as string || ""}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 text-xs">
                    {slaPerformance?.data?.avg?.name ? (
                      slaPerformance.data.avg.name as string || ""
                    ) : (
                      <div className="flex items-center justify-center">
                        <Skeleton height={20} width={120} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/**
            * Case Status Overview
            * Widget Name: ProgressCircularWidget, MetricWidget, ProgressBarWidget
            * Chart Type: Pie/Donut, Metric (Custom), ProgressBar (Custom)
            */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 gap-2 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {caseStatusOverview?.name || ""}
                </h3>
              </div>

              {/* ProgressCircularWidget */}
              <div className="flex justify-center mb-2">
                <Chart options={caseStatusOverview?.data?.options || []} series={caseStatusOverview.data.series || []} height={progressCircularWidgetHeight} type="donut" />
                {/*
                {caseStatusOverview?.data?.series?.reduce((acc, curr) => acc + curr, 0) ? (
                  <Chart options={caseStatusOverview?.data?.options || []} series={caseStatusOverview.data.series || []} height={progressCircularWidgetHeight} type="donut" />
                ) : (
                  <div className="flex items-center justify-center" style={{height: `${(progressCircularWidgetHeight - 10) || 0}px`}}>
                    <LoadingSpinner className="h-full" color="gray" size="xl" />
                  </div>
                )}
                */}
              </div>

              {/* MetricWidget */}
              <div className="flex flex-col gap-2 mb-2">
                <div className="bg-green-400 px-4 py-2 rounded-lg">
                  <div className="text-white text-sm">{labels?.complete || ""}</div>
                  {seriesOfCaseStatusOverview[0] !== null && seriesOfCaseStatusOverview[0] !== undefined ? (
                    <AnimatedNumber
                      value={seriesOfCaseStatusOverview[0] || 0}
                      className="text-white text-2xl font-bold"
                      duration={1.2}
                    />
                  ) : (
                    <LoadingSpinner color="white" size="lg" />
                  )}
                  {/* <div className="text-white text-2xl font-bold">{seriesOfCaseStatusOverview[0] || 0}</div> */}
                </div>
                <div className="bg-blue-400 px-4 py-2 rounded-lg">
                  <div className="text-white text-sm">{labels?.inProgress || ""}</div>
                  {seriesOfCaseStatusOverview[1] !== null && seriesOfCaseStatusOverview[1] !== undefined ? (
                    <AnimatedNumber
                      value={seriesOfCaseStatusOverview[1] || 0}
                      className="text-white text-2xl font-bold"
                      duration={1.2}
                    />
                  ) : (
                    <LoadingSpinner color="white" size="lg" />
                  )}
                  {/* <div className="text-white text-2xl font-bold">{seriesOfCaseStatusOverview[1] || 0}</div> */}
                </div>
              </div>

              {/* ProgressBarWidget */}
              <div className="flex-1 space-y-2">
                <div>
                  <div className="flex items-center justify-between mb-2 text-gray-900 dark:text-white">
                    <span className="text-sm">{labels?.complete}</span>
                    {seriesOfMonthlyCasesRate[0] !== null && seriesOfMonthlyCasesRate[0] !== undefined ? (
                      <AnimatedPercentage
                        value={seriesOfMonthlyCasesRate[0] || 0}
                        className="text-sm font-semibold"
                        duration={1.5}
                      />
                    ) : (
                      <Skeleton height={20} width={40} />
                    )}
                    {/*
                    <span className="text-sm font-semibold">
                      {parseInt((seriesOfMonthlyCasesRate[0])?.toString()) || 0}%
                    </span>
                    */}
                  </div>
                  <div className="bg-gray-300 dark:bg-gray-600 h-2 w-full rounded-full">
                    {seriesOfMonthlyCasesRate[0] ? (
                      <div className="bg-blue-400 h-2 rounded-full opacity-60" style={{
                        width: `${seriesOfMonthlyCasesRate[0] <= 100 && seriesOfMonthlyCasesRate[0] || 0}%`
                      }}></div>
                    ) : (
                      <ProgressBar progress={0} />
                    )}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2 text-gray-900 dark:text-white">
                    <span className="text-sm">{labels?.inProgress}</span>
                    {seriesOfMonthlyCasesRate[1] !== null && seriesOfMonthlyCasesRate[1] !== undefined ? (
                      <AnimatedPercentage
                        value={seriesOfMonthlyCasesRate[1] || 0}
                        className="text-sm font-semibold"
                        duration={1.5}
                      />
                    ) : (
                      <Skeleton height={20} width={40} />
                    )}
                    {/*
                    <span className="text-sm font-semibold">
                      {parseInt((seriesOfMonthlyCasesRate[1])?.toString()) || 0}%
                    </span>
                    */}
                  </div>
                  <div className="bg-gray-300 dark:bg-gray-600 h-2 w-full rounded-full">
                    {seriesOfMonthlyCasesRate[1] ? (
                      <div className="bg-blue-400 h-2 rounded-full opacity-60" style={{
                        width: `${seriesOfMonthlyCasesRate[1] <= 100 && seriesOfMonthlyCasesRate[1] || 0}%`
                      }}></div>
                    ) : (
                      <ProgressBar progress={0} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDashboard;
