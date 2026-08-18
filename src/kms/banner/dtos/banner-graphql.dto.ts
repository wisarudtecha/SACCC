

export interface KBGetBannerData {
  id: number;
  order: number;
  articleId: string;
  title: string;
  description: string;
  url: string;
  coverImage: string;
}

export interface KBGetBannerResult {
  total: number;
  data: KBGetBannerData[];
  success: boolean;
  message: string;
}


export interface KBBannerGraphQLData {
  KBBanner: {
    GetBannerList: KBGetBannerResult;
  };
}

export interface KBBannerManageGraphQLData {
  KBBanner: {
    Manage: KBGetBannerResult;
  };
}


export interface ArticleItem {
  articleId: string;
  title: string;
  description: string;
  status: string; //Exclude<ArticleStatus, "all">;
  priority: string;// Exclude<ArticlePriority, "all">;
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
  cat_full_path: string;
  //category: ArticleCategory;
}


export interface KBGetBannerArticleResult {
  total: number;
  hasMore: boolean;
  currentPage: number;
  totalPages: number;
  data: ArticleItem[];
}


export interface KBGetBannerArticleDataResult {
  data: {
    total: number;
    hasMore: boolean;
    currentPage: number;
    totalPages: number;
    data: ArticleItem[];
  }
}



export interface KBBannerGetArticleGraphQLData {
  KBBanner: {
    GetArticleForBannerList: KBGetBannerArticleDataResult;
  };
}
