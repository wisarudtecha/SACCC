import type { ApexOptions } from "apexcharts";
import Chart from "react-apexcharts";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useTheme } from "@/kms/context/ThemeContext";
import { DashboardEndpoints, General } from "@/kms/constant";
import { useDashboardBlockData } from "@/kms/dashboard/hook/useDashboardData";
import KbBlockShell from "@/kms/components/dashboard/KbBlockShell";

const metricValueFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const monthIndexMap: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

const formatTrendLabel = (label: string, language: string) => {
  const [month, year] = label.split(" ");
  const monthIndex = month ? monthIndexMap[month] : undefined;

  if (monthIndex === undefined || !year) {
    return {
      month: month ?? label,
      year: year ?? "",
      fullLabel: label,
    };
  }

  const date = new Date(Date.UTC(Number(year), monthIndex, 1));
  const monthLabel = new Intl.DateTimeFormat(language, {
    month: "short",
    timeZone: "UTC",
  }).format(date);
  const yearLabel = new Intl.DateTimeFormat(language, {
    year: "numeric",
    timeZone: "UTC",
  }).format(date);

  return {
    month: monthLabel,
    year: yearLabel,
    fullLabel: `${monthLabel} ${yearLabel}`,
  };
};

const KbTrendBlock = () => {
  const { t, language } = useTranslation();
  const i18n = {
    language: language
  }

  const { theme } = useTheme();
  const { data, isLoading, isError, isFetching, refetch } =
    useDashboardBlockData("trend");

  if (isLoading) {
    return (
      <div className="h-[420px] animate-pulse rounded-[28px] border border-slate-200/70 bg-white/90 dark:border-white/10 dark:bg-slate-950/70" />
    );
  }

  if (isError || !data) {
    return (
      <KbBlockShell
        title={t("knowledge.dashboard.sections.trend.title")}
        description={t("knowledge.dashboard.sections.trend.description")}
        endpoint={DashboardEndpoints.trend}
        source={General.DASHBOARD_DATA_SOURCE}
        onRefresh={() => { void refetch(); }}
        isFetching={isFetching}
        isError
      >
        <div className="h-[420px] rounded-[24px] border border-slate-200/70 bg-slate-50/60 dark:border-white/10 dark:bg-white/[0.02]" />
      </KbBlockShell>
    );
  }

  const rawLabels = data.data.map((point) => point.label);
  const recentMonthlyCards = data.data.slice(-6);
  const mobileMonthLabels = data.data.filter((_, index) => index % 2 === 0);
  const trendMax = Math.max(...data.data.map((point) => point.value), 1);
  const trendMin = Math.min(...data.data.map((point) => point.value), trendMax);

  //  const lastValue = data.data[data.data.length - 1]?.value ?? 0;
  const lastValue = data.data.reduce(
    (sum, item) => sum + (item.value ?? 0),
    0
  );
  const chartUpperBound = Math.ceil((trendMax * 1.08) / 1000) * 1000;
  const chartLowerBound = Math.max(
    0,
    Math.floor((trendMin * 0.8) / 1000) * 1000,
  );
  // const labelIndexes = new Set([
  //   0,
  //   Math.floor((rawLabels.length - 1) / 2),
  //   rawLabels.length - 1,
  // ]);
  const chartOptions: ApexOptions = {
    chart: {
      type: "area",
      height: 320,
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
      fontFamily: "Outfit, sans-serif",
      foreColor: theme === "dark" ? "#94A3B8" : "#64748B",
    },
    colors: ["#2563EB"],
    stroke: {
      curve: "smooth",
      width: 4,
      lineCap: "round",
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.24,
        opacityTo: 0.04,
        stops: [0, 90, 100],
        colorStops: [
          [
            {
              offset: 0,
              color: "#0EA5E9",
              opacity: 0.32,
            },
            {
              offset: 100,
              color: "#8B5CF6",
              opacity: 0.08,
            },
          ],
        ],
      },
    },
    markers: {
      size: 4,
      hover: {
        size: 6,
      },
      strokeWidth: 3,
      strokeColors: theme === "dark" ? "#020617" : "#FFFFFF",
      colors: ["#7C3AED"],
    },
    dataLabels: {
      enabled: true,
      offsetY: -10,
      background: {
        enabled: false,
      },
      style: {
        fontSize: "11px",
        fontWeight: 600,
        colors: [theme === "dark" ? "#E2E8F0" : "#334155"],
      },
      // formatter: (value, opts) => {
      //   return labelIndexes.has(opts.dataPointIndex)
      //     ? metricValueFormatter.format(Number(value))
      //     : "";
      // },
      formatter: (value) => {
        return metricValueFormatter.format(Number(value));
      },
    },
    grid: {
      borderColor:
        theme === "dark" ? "rgba(148,163,184,0.12)" : "rgba(148,163,184,0.2)",
      strokeDashArray: 6,
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
      padding: {
        top: 12,
        left: 10,
        right: 10,
      },
    },
    tooltip: {
      theme: theme,
      x: {
        formatter: (_value, { dataPointIndex }) =>
          formatTrendLabel(rawLabels[dataPointIndex] ?? "", i18n.language)
            .fullLabel,
      },
      y: {
        formatter: (value) =>
          `${metricValueFormatter.format(value ?? 0)} ${t("knowledge.dashboard.labels.views")}`,
      },
    },
    xaxis: {
      categories: rawLabels,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        show: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    yaxis: {
      min: chartLowerBound,
      max: chartUpperBound,
      tickAmount: 4,
      labels: {
        formatter: (value) => metricValueFormatter.format(value),
        style: {
          fontSize: "11px",
          colors: [theme === "dark" ? "#64748B" : "#94A3B8"],
        },
      },
    },
    legend: {
      show: false,
    },
    responsive: [
      {
        breakpoint: 640,
        options: {
          chart: {
            height: 280,
          },
          stroke: {
            width: 3,
          },
          markers: {
            size: 3,
            hover: {
              size: 5,
            },
          },
          dataLabels: {
            enabled: false,
            offsetY: -8,
            style: {
              fontSize: "10px",
            },
          },
          yaxis: {
            tickAmount: 3,
            labels: {
              style: {
                fontSize: "10px",
              },
            },
          },
        },
      },
    ],
  };

  const series = [
    {
      name: t("knowledge.dashboard.labels.views"),
      data: data.data.map((point) => point.value),
    },
  ];

  return (
    <KbBlockShell
      title={t("knowledge.dashboard.sections.trend.title")}
      description={t("knowledge.dashboard.sections.trend.description")}
      endpoint={data.meta.endpoint}
      source={data.meta.source}
      onRefresh={() => {
        void refetch();
      }}
      isFetching={isFetching}
      aside={
        <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 dark:bg-white/[0.05] dark:text-slate-300">
          {metricValueFormatter.format(lastValue)} {t("knowledge.dashboard.labels.views")}
        </div>
      }
    >
      <div className="space-y-4">
        <div className="overflow-hidden rounded-[24px] border border-slate-200/70 bg-slate-50/80 p-2 sm:p-3 dark:border-white/10 dark:bg-white/[0.03]">



          <div className="relative">
            <Chart
              options={chartOptions}
              series={series}
              type="area"
              height={360}
            />

            <div className="mt-2  hidden grid-cols-6 gap-0 px-[10px] pb-2 text-[14px] font-medium text-slate-400 dark:text-slate-500 sm:grid">
              {rawLabels.map((label) => {
                const { month, year } = formatTrendLabel(
                  label,
                  i18n.language,
                );

                // const left =
                //   rawLabels.length === 1
                //     ? 50
                //     : (index / (rawLabels.length - 1)) * 100;

                 return (
                <div
                  key={label}
                  className="text-center leading-4"
                >
                  <span className="block truncate">
                    {month}
                  </span>

                  <span className="block text-[9px] text-slate-300 dark:text-slate-600">
                    {year}
                  </span>
                </div>
              );
              })}
            </div>
          </div>


          {/* <Chart
            options={chartOptions}
            series={series}
            type="area"
            height={360}
          />
          <div className="mt-2 hidden grid-cols-6 gap-0 px-[10px] pb-2 text-[14px] font-medium text-slate-400 dark:text-slate-500 sm:grid">
            {rawLabels.map((label) => {
              const { month, year } = formatTrendLabel(
                label,
                i18n.language,
              );

              return (
                <div
                  key={label}
                  className="text-center leading-4"
                >
                  <span className="block truncate">
                    {month}
                  </span>

                  <span className="block text-[9px] text-slate-300 dark:text-slate-600">
                    {year}
                  </span>
                </div>
              );
            })}
          </div> */}




          {/* <div className="mt-2 hidden grid-cols-6 gap-2 px-4 pb-2 text-[14px] font-medium text-slate-400 dark:text-slate-500 sm:grid">
            {rawLabels.map((label) => {
              const { month, year } = formatTrendLabel(label, i18n.language);

              return (
                <div key={label} className="text-center leading-4">
          
                  <span className="block truncate">{month}</span>
                  <span className="block text-[9px] text-slate-300 dark:text-slate-600">
                    {year}
                  </span>
                </div>
              );
            })}
          </div> */}
          <div className="mt-2 grid grid-cols-6 gap-2 px-2 pb-2 text-[10px] font-medium text-slate-400 dark:text-slate-500 sm:hidden">


            {mobileMonthLabels.map((point) => {
              const { month, year } = formatTrendLabel(
                point.label,
                i18n.language,
              );

              return (
                <div key={point.label} className="text-center leading-4">

                  <span className="block truncate">{month}</span>
                  <span className="block text-[9px] text-slate-300 dark:text-slate-600">
                    {year}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(128px,1fr))] sm:[grid-template-columns:repeat(auto-fit,minmax(140px,1fr))]">

          {recentMonthlyCards.map((point) => {
            const { month } = formatTrendLabel(point.label, i18n.language);

            return (
              <div
                key={point.label}
                className="rounded-[18px] border border-slate-200/70 bg-white/80 p-3 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-white/[0.03] sm:rounded-[20px] sm:p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    {month}
                  </span>
                  <span className="text-sm font-semibold text-slate-950 dark:text-white sm:text-base">

                    {metricValueFormatter.format(point.value)}
                  </span>
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-slate-200/80 dark:bg-white/10">

                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 to-violet-500"
                    style={{ width: `${lastValue > 0 ? (point.value / lastValue) * 100 : 0}%` }}
                  />

                </div>
              </div>
            );
          })}
        </div>
      </div>
    </KbBlockShell>
  );
};

export default KbTrendBlock;
