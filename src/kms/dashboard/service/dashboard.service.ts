import { DashboardEndpoints, General, GraphQL, MODE } from "@/kms/constant";
import { graphqlRequest } from "@/kms/common/graphql.service";
import {
  LooseRecord,
  pickFirst,
  toNumber,
  toStringValue,
  toNumberArray,
  extractArrayPayload,
  formatDateDMY,
  wait,
} from "@/kms/common/common.transform.service";
import type { KBDashboardGraphQLData } from "@/kms/dashboard/dtos/dashboard-graphql.dto";
import {
  DashboardActivity,
  DashboardArticle,
  DashboardLowArticle,
  DashboardLowArticleMode,
  DashboardBlockDataMap,
  DashboardBlockKey,
  DashboardBlockResponse,
  DashboardCategory,
  DashboardDataSource,
  DashboardMetric,
  DashboardMetricId,
  DashboardMetricTone,
  DashboardSearchKeyword,
  DashboardTrendPoint,
} from "@/kms/dashboard/dtos/dashboard.dto";

type BlockValue<K extends DashboardBlockKey> = DashboardBlockDataMap[K];

const METRICS_TONES: Record<string, DashboardMetricTone> = {
  published: "sky",
  approved: "emerald",
  submitted: "violet",
  expiringSoon: "amber",
  expired: "amber",
  totalViews: "sky",
  avgRating: "violet",
  activeUsers: "emerald",
};

type RawBlockMap = {
  metrics: LooseRecord[];
  trend: LooseRecord[];
  categories: LooseRecord[];
  searches: LooseRecord[];
  articles: LooseRecord[];
  activity: LooseRecord[];
};

const normalizeMetricId = (value: unknown): DashboardMetricId => {
  const rawValue = toStringValue(value, "published");

  switch (rawValue) {
    case "approved":
    case "submitted":
    case "expiringSoon":
    case "expired":
    case "totalViews":
    case "activeUsers":
    case "avgRating":
    case "published":
      return rawValue;
    case "approvedPublished":
      return "approved";
    case "weeklyPublished":
      return "submitted";
    case "expiring":
    case "nearExpiry":
      return "expiringSoon";
    case "expiringStatus":
      return "expired";
    default:
      return "published";
  }
};

const normalizeTone = (value: unknown): DashboardMetricTone => {
  const rawValue = toStringValue(value, "sky");

  switch (rawValue) {
    case "violet":
    case "emerald":
    case "amber":
    case "sky":
      return rawValue;
    default:
      return "sky";
  }
};


const mapMetric = (rawMetric: LooseRecord): DashboardMetric => ({
  // map metric จากหลายชื่อ field ให้กลายเป็น shape กลางที่ UI ใช้
  id: normalizeMetricId(
    pickFirst(
      rawMetric.id,
      rawMetric.metricId,
      rawMetric.metric_id,
      rawMetric.key,
    ),
  ),
  value: toNumber(
    pickFirst(
      rawMetric.value,
      rawMetric.total,
      rawMetric.count,
      rawMetric.score,
    ),
    0,
  ),
  change: toNumber(
    pickFirst(
      rawMetric.change,
      rawMetric.delta,
      rawMetric.deltaPercent,
      rawMetric.changePct,
    ),
    0,
  ),
  description: toStringValue(
    pickFirst(
      rawMetric.description,
      rawMetric.hint,
      rawMetric.context,
      rawMetric.note,
    ),
    "",
  ),
  trend: toNumberArray(
    pickFirst(
      rawMetric.trend,
      rawMetric.sparkline,
      rawMetric.series,
      rawMetric.values,
    ),
  ),
  tone: normalizeTone(
    pickFirst(
      rawMetric.tone,
      rawMetric.colorTone,
      rawMetric.variant,
      rawMetric.palette,
    ),
  ),
});

const mapTrendPoint = (rawPoint: LooseRecord): DashboardTrendPoint => ({
  // ถ้า API ส่ง monthLabel หรือ period_name ให้เพิ่มตรง label/value ได้เลย
  label: toStringValue(
    pickFirst(rawPoint.label, rawPoint.month, rawPoint.name, rawPoint.period),
    "",
  ),
  value: toNumber(
    pickFirst(rawPoint.value, rawPoint.views, rawPoint.count, rawPoint.total),
    0,
  ),
});

const mapCategory = (rawCategory: LooseRecord): DashboardCategory => ({
  // เพิ่มชื่อ field ใหม่ของ category ที่ backend ส่งมาใน pickFirst ด้านล่างนี้
  id: toStringValue(
    pickFirst(rawCategory.id, rawCategory.categoryId, rawCategory.slug),
    "category",
  ),
  label: toStringValue(
    pickFirst(
      rawCategory.label,
      rawCategory.name,
      rawCategory.categoryName,
      rawCategory.title,
    ),
    "Category",
  ),
  value: toNumber(
    pickFirst(rawCategory.value, rawCategory.count, rawCategory.articleCount),
    0,
  ),
  share: toNumber(
    pickFirst(rawCategory.share, rawCategory.percent, rawCategory.ratio),
    0,
  ),
  color: toStringValue(
    pickFirst(rawCategory.color, rawCategory.hex, rawCategory.segmentColor),
    "#38BDF8",
  ),
});

const mapSearch = (rawSearch: LooseRecord): DashboardSearchKeyword => ({
  // map คำค้นหาให้เหลือ label / hits / share ตามที่ component ใช้
  id: toStringValue(
    pickFirst(rawSearch.id, rawSearch.keywordId, rawSearch.key),
    "search",
  ),
  label: toStringValue(
    pickFirst(
      rawSearch.label,
      rawSearch.keyword,
      rawSearch.term,
      rawSearch.query,
    ),
    "",
  ),
  hits: toNumber(
    pickFirst(
      rawSearch.hits,
      rawSearch.searches,
      rawSearch.volume,
      rawSearch.count,
    ),
    0,
  ),
  share: toNumber(
    pickFirst(rawSearch.share, rawSearch.percent, rawSearch.ratio),
    0,
  ),
});

const mapArticle = (rawArticle: LooseRecord): DashboardArticle => ({
  id: toStringValue(
    pickFirst(rawArticle.id, rawArticle.articleId, rawArticle.slug),
    "article",
  ),
  title: toStringValue(
    pickFirst(rawArticle.title, rawArticle.articleTitle, rawArticle.name),
    "Untitled article",
  ),
  views: toNumber(
    pickFirst(rawArticle.views, rawArticle.viewCount, rawArticle.totalViews),
    0,
  ),
  likes: toNumber(
    pickFirst(rawArticle.likes, rawArticle.likeCount, rawArticle.hearts),
    0,
  ),
  avgScore: toNumber(
    pickFirst(rawArticle.avgScore, rawArticle.score, rawArticle.rating),
    0,
  ),
  updatedAt: formatDateDMY(
    toStringValue(
      pickFirst(rawArticle.updatedAt, rawArticle.lastUpdated, rawArticle.modifiedAt),
      "",
    ),
  ),
});

const mapActivity = (rawActivity: LooseRecord): DashboardActivity => ({
  // activity ใช้ title / detail / at ถ้า API ใช้ชื่ออื่นให้ map ที่นี่
  id: toStringValue(
    pickFirst(rawActivity.id, rawActivity.activityId, rawActivity.key),
    "activity",
  ),
  title: toStringValue(
    pickFirst(rawActivity.title, rawActivity.name, rawActivity.headline),
    "",
  ),
  detail: toStringValue(
    pickFirst(rawActivity.detail, rawActivity.description, rawActivity.message),
    "",
  ),
  at: toStringValue(
    pickFirst(rawActivity.at, rawActivity.time, rawActivity.createdAt),
    "",
  ),
});

const buildLast12MonthTrend = (): LooseRecord[] => {
  const monthlyValues = [
    6100, 6900, 7600, 8200, 8800, 9500, 10300, 11200, 12100, 12900, 13800,
    14800,
  ];
  const currentDate = new Date();

  return monthlyValues.map((value, index) => {
    const monthDate = new Date(
      Date.UTC(
        currentDate.getUTCFullYear(),
        currentDate.getUTCMonth() - (monthlyValues.length - 1 - index),
        1,
      ),
    );

    return {
      label: monthDate.toLocaleString("en-US", {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }),
      value,
    };
  });
};

const rawMockBlockMap: RawBlockMap = {
  metrics: [
    {
      metric_id: "published",
      total: 1284,
      deltaPercent: 12.4,
      hint: "48 articles refreshed after review",
      sparkline: [180, 220, 210, 245, 262, 288, 302],
      variant: "sky",
    },
    {
      key: "approved",
      count: 72,
      changePct: 5.4,
      context: "Articles fully approved by reviewers this week",
      series: [9, 10, 11, 10, 12, 10, 10],
      palette: "emerald",
    },
    {
      key: "submitted",
      count: 56,
      changePct: 8.1,
      context: "New article and edit requests submitted this week",
      series: [8, 9, 6, 10, 7, 8, 8],
      palette: "violet",
    },
    {
      id: "expiringSoon",
      value: 27,
      delta: -1.3,
      note: "Articles entering the next review window soon",
      trend: [31, 29, 29, 28, 28, 27, 27],
      tone: "amber",
    },
    {
      id: "expired",
      value: 14,
      delta: -2.1,
      note: "Articles already beyond the review or expiry window",
      trend: [18, 16, 16, 15, 15, 14, 14],
      tone: "amber",
    },
    {
      metricId: "totalViews",
      total: 24876,
      changePct: 14.6,
      description: "Total article views from the current reporting period",
      values: [2800, 3100, 3500, 3900, 4200, 3600, 4676],
      colorTone: "sky",
    },
    {
      id: "activeUsers",
      value: 18,
      delta: 4.7,
      note: "Writers, approvers, and SMEs currently active",
      trend: [10, 11, 13, 12, 15, 17, 18],
      tone: "emerald",
    },
    {
      metricId: "avgRating",
      score: 4.7,
      change: 0.3,
      description: "Average article quality rating from readers",
      values: [4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7],
      colorTone: "violet",
    },
  ],
  // ใช้ 12 เดือนล่าสุดถึงเดือนปัจจุบันอัตโนมัติ
  trend: buildLast12MonthTrend(),
  categories: [
    {
      categoryId: "getting-started",
      categoryName: "Getting Started",
      articleCount: 42,
      percent: 28,
      hex: "#0EA5E9",
    },
    {
      id: "troubleshooting",
      label: "Troubleshooting",
      value: 31,
      share: 22,
      color: "#8B5CF6",
    },
    {
      slug: "billing",
      title: "Billing",
      count: 19,
      ratio: 18,
      segmentColor: "#10B981",
    },
    {
      categoryId: "automation",
      categoryName: "Automation",
      articleCount: 16,
      percent: 17,
      hex: "#F59E0B",
    },
    {
      slug: "security",
      title: "Security",
      count: 11,
      ratio: 15,
      segmentColor: "#F97316",
    },
  ],
  searches: [
    { keywordId: "sso", keyword: "SSO login", searches: 328, percent: 94 },
    { id: "reset-password", label: "Reset password", hits: 296, share: 85 },
    { key: "workflow", term: "Approval workflow", volume: 244, ratio: 70 },
    {
      keywordId: "mobile-app",
      query: "Mobile app setup",
      searches: 213,
      percent: 61,
    },
    { id: "permissions", label: "Role permission", hits: 188, share: 54 },
  ],
  articles: [
    {
      id: "kb-101",
      title: "Configure SSO and domain mapping",
      views: 1840,
      likes: 116,
      avgScore: 4.8,
      updatedAt: "30/03/2026",
    },
    {
      id: "kb-204",
      title: "Troubleshoot intermittent agent disconnects",
      views: 1286,
      likes: 74,
      avgScore: 4.5,
      updatedAt: "29/03/2026",
    },
    {
      id: "kb-331",
      title: "Set up article approval rules by team",
      views: 968,
      likes: 39,
      avgScore: 4.2,
      updatedAt: "27/03/2026",
    },
  ],
  activity: [
    {
      activityId: "act-1",
      headline: "Billing onboarding guide updated",
      message: "Reviewed by Support Enablement and republished to production.",
      createdAt: "12 min ago",
    },
    {
      id: "act-2",
      title: "Permission matrix article awaiting approval",
      detail: "Waiting for final legal review before publication.",
      at: "48 min ago",
    },
    {
      key: "act-3",
      name: "Search intent cluster regenerated",
      description:
        "Top search keywords recalculated from the latest weekly traffic.",
      time: "1 hr ago",
    },
  ],
};

const mapBlockData = <K extends DashboardBlockKey>(
  key: K,
  payload: RawBlockMap[K],
): BlockValue<K> => {
  switch (key) {
    case "metrics":
      return (payload as LooseRecord[]).map((item) =>
        mapMetric(item),
      ) as BlockValue<K>;
    case "trend":
      return (payload as LooseRecord[]).map((item) =>
        mapTrendPoint(item),
      ) as BlockValue<K>;
    case "categories":
      return (payload as LooseRecord[]).map((item) =>
        mapCategory(item),
      ) as BlockValue<K>;
    case "searches":
      return (payload as LooseRecord[]).map((item) =>
        mapSearch(item),
      ) as BlockValue<K>;
    case "articles":
      return (payload as LooseRecord[]).map((item) =>
        mapArticle(item),
      ) as BlockValue<K>;
    case "activity":
      return (payload as LooseRecord[]).map((item) =>
        mapActivity(item),
      ) as BlockValue<K>;
    default:
      return [] as unknown as BlockValue<K>;
  }
};

const resolveDashboardDataSource = (): DashboardDataSource => {
  if (General.DASHBOARD_DATA_SOURCE) {
    return General.DASHBOARD_DATA_SOURCE;
  }

  return General.MODE === MODE.LOCAL ? "mock" : "api";
};

const fetchApiBlock = async <K extends DashboardBlockKey>(
  key: K,
): Promise<RawBlockMap[K]> => {
  // endpoint ถูกดึงจาก constant.ts ถ้าจะเปลี่ยน path ให้ไปแก้ไฟล์ constant
  const endpoint = DashboardEndpoints[key];
  const url = `${General.API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch dashboard block: ${key}`);
  }

  const json = (await response.json()) as unknown;

  return extractArrayPayload(json) as RawBlockMap[K];
};

const fetchMockBlock = async <K extends DashboardBlockKey>(
  key: K,
): Promise<RawBlockMap[K]> => {
  await wait(120);
  return rawMockBlockMap[key];
};

const GET_SUMMARY_QUERY =
  "query { KBDashboard { GetSummary { statusCode success message data } } }";

const GET_VIEW_LINE_CHART_QUERY =
  "query { KBDashboard { GetViewLineChart { statusCode success message data } } }";

const GET_TOP5_CATEGORY_QUERY =
  "query { KBDashboard { GetTop5Category { statusCode success message data } } }";

const fetchTrendFromGraphQL = async (): Promise<DashboardTrendPoint[]> => {
  const res = await graphqlRequest<KBDashboardGraphQLData>({
    query: GET_VIEW_LINE_CHART_QUERY,
  });

  const { categories, series } = res.data.KBDashboard.GetViewLineChart.data;
  const values = series[0]?.data ?? [];

  return categories.map((label, i) => ({
    label,
    value: values[i] ?? 0,
  }));
};

const CATEGORY_COLORS = [
  "#0EA5E9",
  "#8B5CF6",
  "#10B981",
  "#F59E0B",
  "#F97316",
];

const fetchCategoriesFromGraphQL = async (): Promise<DashboardCategory[]> => {
  const res = await graphqlRequest<KBDashboardGraphQLData>({
    query: GET_TOP5_CATEGORY_QUERY,
  });

  const { labels, series, percent } =
    res.data.KBDashboard.GetTop5Category.data;

  return labels.map((label, i) => ({
    id: label.toLowerCase().replace(/\s+/g, "-"),
    label,
    value: series[i] ?? 0,
    share: percent[i] ?? 0,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] ?? "#0EA5E9",
  }));
};

const fetchMetricsFromGraphQL = async (): Promise<DashboardMetric[]> => {
  const res = await graphqlRequest<KBDashboardGraphQLData>({
    query: GET_SUMMARY_QUERY,
  });

  const summaryData = res.data.KBDashboard.GetSummary.data;

  const entries: Array<[DashboardMetricId, number]> = [
    ["published", summaryData.articlesPublished],
    ["approved", summaryData.approved],
    ["submitted", summaryData.submitted],
    ["expiringSoon", summaryData.expiringSoon],
    ["expired", summaryData.expired],
    ["totalViews", summaryData.totalViews],
    ["avgRating", summaryData.avgRating],
   // ["activeUsers", summaryData.activeUsers],
  ];

  return entries.map(([id, value]) => ({
    id,
    value,
    change: 0,
    description: "",
    trend: [],
    tone: METRICS_TONES[id] ?? "sky",
  }));
};

export const getArticlesList = async (
  type: import("@/kms/dashboard/dtos/dashboard-graphql.dto").ArticleListType,
): Promise<DashboardBlockResponse<DashboardArticle[]>> => {
  const source = resolveDashboardDataSource();

  if (source === "api") {
    const res = await graphqlRequest<KBDashboardGraphQLData>({
      query: `query { KBDashboard { GetArticlesList(input: { type: "${type}" }) { statusCode success message data } } }`,
    });
    const items = res.data.KBDashboard.GetArticlesList.data.items;
    return {
      data: items.map((item) => ({
        id: String(item.artId),
        title: item.title,
        views: item.views,
        likes: item.likes,
        avgScore: item.avgScore,
        updatedAt: formatDateDMY(item.updatedDate),
      })),
      meta: { key: "articles", endpoint: GraphQL.URL, source },
    };
  }

  await wait(120);
  return {
    data: rawMockBlockMap.articles.map(mapArticle),
    meta: { key: "articles", endpoint: DashboardEndpoints.articles, source },
  };
};

const GET_LOW_RATING_QUERY =
  "query { KBDashboard { GetLowAverageRatingArticles { statusCode success message data } } }";

const GET_LOW_VIEW_QUERY =
  "query { KBDashboard { GetLowViewArticles { statusCode success message data } } }";

export const getLowArticles = async (
  mode: DashboardLowArticleMode,
): Promise<DashboardBlockResponse<DashboardLowArticle[]>> => {
  const source = resolveDashboardDataSource();

  if (source === "api") {
    if (mode === "lowScore") {
      const res = await graphqlRequest<KBDashboardGraphQLData>({
        query: GET_LOW_RATING_QUERY,
      });
      const items = res.data.KBDashboard.GetLowAverageRatingArticles.data.items;
      return {
        data: items.map((item) => ({
          id: String(item.artId),
          title: item.title,
          score: item.avgScore,
        })),
        meta: { key: "activity", endpoint: GraphQL.URL, source },
      };
    }

    const res = await graphqlRequest<KBDashboardGraphQLData>({
      query: GET_LOW_VIEW_QUERY,
    });
    const items = res.data.KBDashboard.GetLowViewArticles.data.items;
    return {
      data: items.map((item) => ({
        id: String(item.artId),
        title: item.title,
        score: item.view,
      })),
      meta: { key: "activity", endpoint: GraphQL.URL, source },
    };
  }
  return {
    data: [],
    meta: { key: "activity", endpoint: DashboardEndpoints.activity, source },
  };
};

export const getDashboardBlock = async <K extends DashboardBlockKey>(
  key: K,
): Promise<DashboardBlockResponse<BlockValue<K>>> => {
  const source = resolveDashboardDataSource();

  if (source === "api" && key === "metrics") {
    const metrics = await fetchMetricsFromGraphQL();
    return {
      data: metrics as BlockValue<K>,
      meta: { key, endpoint: GraphQL.URL, source },
    };
  }

  if (source === "api" && key === "trend") {
    const trend = await fetchTrendFromGraphQL();
    return {
      data: trend as BlockValue<K>,
      meta: { key, endpoint: GraphQL.URL, source },
    };
  }

  if (source === "api" && key === "categories") {
    const categories = await fetchCategoriesFromGraphQL();
    return {
      data: categories as BlockValue<K>,
      meta: { key, endpoint: GraphQL.URL, source },
    };
  }

  const rawPayload =
    source === "api" ? await fetchApiBlock(key) : await fetchMockBlock(key);

  return {
    data: mapBlockData(key, rawPayload),
    meta: {
      key,
      endpoint: DashboardEndpoints[key],
      source,
    },
  };
};

// export const buildCategoryDonut = (categories: DashboardCategory[]): string => {
//   let currentStop = 0;

//   return `conic-gradient(${categories
//     .map((category) => {
//       console.log(category)
//       const start = currentStop;
//       // currentStop += category.share;
//         currentStop += category.value;
//         console.log( `${category.color} ${start}% ${currentStop}%`)
//       return `${category.color} ${start}% ${currentStop}%`;
//     })
//     .join(", ")})`;
// };

export const buildCategoryDonut = (
  categories: DashboardCategory[]
): string => {
  const total = categories.reduce(
    (sum, category) => sum + category.value,
    0
  );

  let currentStop = 0;

  return `conic-gradient(${categories
    .map((category, index) => {
      const start = currentStop;

      const percentage =
        total === 0 ? 0 : (category.value / total) * 100;

      const end =
        index === categories.length - 1
          ? 100
          : currentStop + percentage;

      currentStop = end;

      return `${category.color} ${start}% ${end}%`;
    })
    .join(", ")})`;
};

export const buildTrendPath = (points: DashboardTrendPoint[]): string => {
  if (points.length === 0) {
    return "";
  }

  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const denominator = Math.max(points.length - 1, 1);

  return points
    .map((point, index) => {
      const x = (index / denominator) * 100;
      const y = 100 - (point.value / maxValue) * 100;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
};

export const buildSparklinePath = (values: number[]): string => {
  if (values.length === 0) {
    return "";
  }

  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values);
  const range = Math.max(maxValue - minValue, 1);
  const denominator = Math.max(values.length - 1, 1);

  return values
    .map((value, index) => {
      const x = (index / denominator) * 100;
      const y = 100 - ((value - minValue) / range) * 100;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
};

