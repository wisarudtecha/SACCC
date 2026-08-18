export interface KBGetSummaryData {
  articlesPublished: number;
  approved: number;
  submitted: number;
  expiringSoon: number;
  expired: number;
  totalViews: number;
  avgRating: number;
  activeUsers: number;
}

export interface KBGetSummaryResult {
  statusCode: number;
  success: boolean;
  message: string;
  data: KBGetSummaryData;
}

export interface KBViewLineChartSeries {
  name: string;
  data: number[];
}

export interface KBGetViewLineChartData {
  categories: string[];
  series: KBViewLineChartSeries[];
}

export interface KBGetViewLineChartResult {
  statusCode: number;
  success: boolean;
  message: string;
  data: KBGetViewLineChartData;
}

export interface KBGetTop5CategoryData {
  labels: string[];
  series: number[];
  percent: number[];
}

export interface KBGetTop5CategoryResult {
  statusCode: number;
  success: boolean;
  message: string;
  data: KBGetTop5CategoryData;
}

export type ArticleListType = "top" | "latest" | "popular";

export interface KBGetArticlesListItem {
  artId: number;
  title: string;
  views: number;
  likes: number;
  avgScore: number;
  updatedDate: string;
}

export interface KBGetArticlesListData {
  count: number;
  items: KBGetArticlesListItem[];
}

export interface KBGetArticlesListResult {
  statusCode: number;
  success: boolean;
  message: string;
  data: KBGetArticlesListData;
}

export interface KBLowRatingArticleItem {
  artId: number;
  title: string;
  avgScore: number;
}

export interface KBGetLowAverageRatingArticlesResult {
  statusCode: number;
  success: boolean;
  message: string;
  data: { count: number; items: KBLowRatingArticleItem[] };
}

export interface KBLowViewArticleItem {
  artId: number;
  title: string;
  view: number;
}

export interface KBGetLowViewArticlesResult {
  statusCode: number;
  success: boolean;
  message: string;
  data: { count: number; items: KBLowViewArticleItem[] };
}

export interface KBDashboardGraphQLData {
  KBDashboard: {
    GetSummary: KBGetSummaryResult;
    GetViewLineChart: KBGetViewLineChartResult;
    GetTop5Category: KBGetTop5CategoryResult;
    GetArticlesList: KBGetArticlesListResult;
    GetLowAverageRatingArticles: KBGetLowAverageRatingArticlesResult;
    GetLowViewArticles: KBGetLowViewArticlesResult;
  };
}
