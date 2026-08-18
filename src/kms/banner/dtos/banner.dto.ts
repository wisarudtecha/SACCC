export type BannerDataSource = "mock" | "api";

export interface BannerItem {
  id: string;
  order: number;
  articleId: string;
  title: string;
  url: string;
  coverImage?: string;
  description?: string;
}

export interface BannerMutationInput {
  articleId: string;
  title: string;
  url: string;
  coverImage?: string;
  description?: string;
  lang?:string;
  mode?:string;
}

export interface BannerActionResponse {
  success: boolean;
  message: string;
  banner?: BannerItem;
}


export interface BannerDeleteResponse {
  success: boolean,
  message: string,
}

export interface BannerReorderResponse {
  success: boolean;
  message: string;
  banner?: BannerItem;
}

export type ArticleSortBy =
  | "in_review"
  | "published"
  | "high_priority"
  | "latest"
  | "newest"
  | "oldest"
  | "most_viewed"
  | "highest_rated"
  | "title_az";



export interface ArticleFilter {
  search?: string;
  sortBy?: ArticleSortBy;
  page?: number;
  pageSize?: number;
  status?: ArticleStatus;
  priority?: ArticlePriority;

}




export type ArticleStatus =
  | "all"
  | "publish"
  | "wait_approve"
  | "draft"
  | "archived";

export type ArticlePriority = "all" | "high" | "medium" | "low";

export interface ArticleCategory {
  id: string;
  label: string;
  /** Breadcrumb path e.g. "ABCD > ABC > ABCD > ABCD" */
  path: string;
}



export interface ArticleItem {
  articleId: string;
  title: string;
  description: string;
  status: string;// Exclude<ArticleStatus, "all">;
  status_value:string;
  priority: string;
  version: number;
  viewCount: number;
  rating: number;
  /** 1–5 */
  ratingMax: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  group: string;
  score: number;
  cat_full_path: string;
  category: ArticleCategory;
}

export interface BannerArticleResponse {
  total: number;
  hasMore: boolean;
  currentPage: number;
  totalPages: number;
  data: ArticleItem[];
}