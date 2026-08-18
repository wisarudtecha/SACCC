export type ArticleBlockKey = "list";

export type ArticleDataSource = "mock" | "api";

export type ArticleStatus =
  | "-1"
  | "all"
  | "published"
  | "review"
  | "draft"
  | "archived"
  | "publish"
  | "wait_publish"
  | "unpublished"
  | "wait_approve"

export type ArticlePriority = "all" | "high" | "medium" | "low";

export type ArticleSortBy =
  | "newest"
  | "oldest"
  | "most_viewed"
  | "highest_rated"
  | "title_az";

export interface ArticleCategory {
  id: string;
  label: string;
  /** Breadcrumb path e.g. "ABCD > ABC > ABCD > ABCD" */
  path: string;
}

export interface ArticleItem {
  id: string;
  articleId: number;
  title: string;
  description: string;
  status: Exclude<ArticleStatus, "all">;
  status_value: string;
  priority: Exclude<ArticlePriority, "all">;
  version: string;
  viewCount: number;
  rating: number;
  /** 1–5 */
  ratingMax: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  group: string;
  score: number;
  category: ArticleCategory;
}

export interface ArticleListResult {
  items: ArticleItem[];
  total: number;
  page: number;
  pageSize: number;
}





export interface AdminArticleListResult {
  data: {
    total: number;
    hasMore: boolean;
    currentPage: number;
    totalPages: number;
    data: ArticleItem[];
  };
  total: number;
  page: number;
  pageSize: number;
}

export interface ArticleFilter {
  search?: string;
  category?: string;
  createdBy?: string;
  status?: ArticleStatus;
  version?: string;
  group?: string;
  priority?: ArticlePriority;
  score?: string;
  sortBy?: ArticleSortBy;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface ArticleBlockDataMap {
  list: ArticleListResult;
}

export interface ArticleBlockMeta {
  key: ArticleBlockKey;
  endpoint: string;
  source: ArticleDataSource;
}

export interface ArticleBlockResponse<TData> {
  data: TData;
  meta: ArticleBlockMeta;
}

// ─── Article Detail ───────────────────────────────────────────────────────────

export type ArticleLogAction =
  | "create" | "edit" | "submit" | "approve" | "publish" | "archive" | "draft";

export interface ArticleAttachment {
  name: string;
  path: string;
  sizeLabel: string;
  ext: string;
}

export interface ArticleLogEntry {
  id: string;
  action: ArticleLogAction;
  actor: string;
  at: string;
  note?: string;
}

export interface ArticleActivityLogEntry {
  id: string;
  action: string;
  actor: string;
  at: string;
  note?: string;
}


export interface ArticleNextStatusEntry {
  id: number;
  value: string;
  seq: number;
  action_name_th: string;
  action_name_en: string;
  next_status_id: number;

}


export interface ArticleDetail extends ArticleItem {
  content: string;
  source: string;
  ownership: string;
  startDate: string;
  endDate: string;
  viewableGroups: string[];
  keywords: string[];
  relatedArticles: { id: string; title: string }[];
  attachments: ArticleAttachment[];
  activityLog: ArticleLogEntry[];
  nextstatus?: ArticleNextStatusEntry[];
  /** MinIO path or full URL; undefined = show gradient placeholder */
  coverImage?: string;
}

export interface ArticleDetailInfo {
  sourceName: string;
  priorityName: string;
  displayName: string | null;
  receiveDate: string | null;
  startDate: string | null;
  expirationDate: string | null;
  relatedArticles: { id: string; title: string }[];
  keywords: string[];
  viewableGroups: string[];
  attachments: ArticleAttachment[];
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export interface ArticleCommentReply {
  id: string;
  author: string;
  authorInitials: string;
  content: string;
  likes: number;
  likedByMe: boolean;
  createdAt: string;
}

export interface ArticleComment {
  id: string;
  author: string;
  authorInitials: string;
  content: string;
  /** avg rating this comment received from other readers */
  rating: number;
  ratingCount: number;
  /** rating current user gave this comment (0 = not yet rated) */
  myRating: number;
  likes: number;
  likedByMe: boolean;
  createdAt: string;
  replies: ArticleCommentReply[];
}

export interface ArticleNextStatusAndActivity {
  activitylog?: ArticleActivityLogEntry[];
  nextstatus?: ArticleNextStatusEntry[];

}
