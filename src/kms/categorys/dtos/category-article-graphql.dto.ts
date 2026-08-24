export interface KBFileListGraphQLData {
  statusCode: number;
  success: boolean;
  message: string;
  data?: {
    count?: number,
    items: unknown[];
    meta?: {
      key: string;
      endpoint: string;
      source: string;
    };
  };
}



export interface GetCategoryArticleList {
    statusCode: number;
    success: boolean;
    message: string;
    data?: {
      items: CategoryArticleItem[];
      pagination?: {
        limit: number;
        hasMore: boolean;
        nextCursor?: string | null;
      };
    };
}

export interface CategoryArticleItem {
  artId: number;
  title: string;
  description: string;
  descriptionEn: string;
  keyWord: string[];
  views: number;
  likes: number;
  score: {
    value: number;
    min: number;
    max: number;
  };
  updatedDate: string;
  url: string;
  startDate: string;
  expirationDate: string;
  isActive: boolean;
  coverImgUrl?: string;
}

export interface CategoryArticleListParams {
  search?: string;
  categoryId?: number;
  limit?: number;
  cursor?: string;
}
