export type DashboardMetricId =
  | "published"
  | "approved"
  | "submitted"
  | "expiringSoon"
  | "expired"
  | "totalViews"
  | "activeUsers"
  | "avgRating";

export type DashboardBlockKey =
  | "metrics"
  | "trend"
  | "categories"
  | "searches"
  | "articles"
  | "activity";

export type DashboardDataSource = "mock" | "api";

export type DashboardMetricTone = "sky" | "violet" | "emerald" | "amber";

export interface DashboardMetric {
  id: DashboardMetricId;
  value: number;
  change: number;
  description: string;
  trend: number[];
  tone: DashboardMetricTone;
}

export interface DashboardTrendPoint {
  label: string;
  value: number;
}

export interface DashboardCategory {
  id: string;
  label: string;
  value: number;
  share: number;
  color: string;
}

export interface DashboardSearchKeyword {
  id: string;
  label: string;
  hits: number;
  share: number;
}

export interface DashboardArticle {
  id: string;
  title: string;
  views: number;
  likes: number;
  avgScore: number;
  updatedAt: string;
}

export interface DashboardActivity {
  id: string;
  title: string;
  detail: string;
  at: string;
}

export type DashboardLowArticleMode = "lowScore" | "lowView";

export interface DashboardLowArticle {
  id: string;
  title: string;
  score: number;
}

export interface DashboardOverview {
  metrics: DashboardMetric[];
  trend: DashboardTrendPoint[];
  categories: DashboardCategory[];
  searches: DashboardSearchKeyword[];
  articles: DashboardArticle[];
  activities: DashboardActivity[];
}

export interface DashboardBlockMeta {
  key: DashboardBlockKey;
  endpoint: string;
  source: DashboardDataSource;
}

export interface DashboardBlockResponse<TData> {
  data: TData;
  meta: DashboardBlockMeta;
}

export interface DashboardBlockDataMap {
  metrics: DashboardMetric[];
  trend: DashboardTrendPoint[];
  categories: DashboardCategory[];
  searches: DashboardSearchKeyword[];
  articles: DashboardArticle[];
  activity: DashboardActivity[];
}
