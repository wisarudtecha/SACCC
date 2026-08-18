


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


export interface KBGetArticleResult {
  total: number;
  hasMore: boolean;
  currentPage: number;
  totalPages: number;
  data: ArticleItem[];
}


export interface KBGetArticleDataResult {
  data: {
    total: number;
    hasMore: boolean;
    currentPage: number;
    totalPages: number;
    data: ArticleItem[];
  }
}


export interface KBGetArticleStatusDataResult {
  success: boolean,
  statusCode: number,
  message: string,
  data: {
    statusId: number,
    name_th: string,
    name_en: string,
    value: string
  }[];

}


export interface KBGetArticlePriorityDataResult {
  success: boolean,
  statusCode: number,
  message: string,
  data: {
    priorityId: number,
    name_th: string,
    name_en: string,
    value: string
  }[];
}




export interface KBArticleGraphQLData {
  KBArticles: {
    GetViewList: KBGetArticleDataResult;
  };
}

export interface KBArticleStatusGraphQLData {
  KBMasterCommonData: {
    GetArticleStatus: KBGetArticleStatusDataResult;
  };
}




export interface KBArticlePriorityGraphQLData {
  KBMasterCommonData: {
    GetArticlePriority: {
      statusCode: number;
      success: boolean | null;
      message: string;
      data: { priorityId: number; name_th: string; name_en: string; value: string }[];
    };
  };
}

export interface KBArticleOwnershipGraphQLData {
  KBMasterCommonData: {
    GetArticleOwnership: {
      statusCode: number;
      success: boolean | null;
      message: string;
      data: { id: number; firstName: string; lastName: string; fullName: string }[];
    };
  };
}




export interface KBGetArticleUserDataResult {
  success: boolean,
  statusCode: number,
  message: string,
  data: {
    id: number,
    firstName: string,
    lastName: string,
    fullName:string
  }[];
}

export interface KBArticleUserGraphQLData {
  KBMasterCommonData: {
    GetAllUser: KBGetArticleUserDataResult;
  };
}





export interface KBGetArticleMasterDataResult {
  success: boolean,
  statusCode: number,
  message: string,
  data: {
    id: number,
    item_name: string,
    item_value: string
  }[];
}

export interface KBArticleMasterGraphQLData {
  KBMasterCommonData: {
    GetGeneralMasterData: KBGetArticleMasterDataResult;
  };
}

export interface KBArticleDetailHeaderData {
  artId: number;
  title: string;
  description: string;
  statusId: number;
  status: string;
  version: number;
  coverImgUrl: string;
  ownerId: number | null;
  priorityId: number;
  priority: string;
  createdDate: string;
  updatedDate: string;
  ratingMax: number;
  avgScore: number;
  viewCount: number;
  totalScore: number;
  source: {
    name_th: string;
    name_en: string;
  } | null;
  category: {
    id: number;
    label: string;
    parentId: number | null;
    fullPath: string;
  } | null;
}

export interface KBArticleDetailHeaderResult {
  statusCode: number | null;
  success: boolean;
  message: string;
  data: KBArticleDetailHeaderData;
}

export interface KBArticleDetailHeaderGraphQLData {
  KBArticles: {
    GetArticleDetailHeader: KBArticleDetailHeaderResult;
  };
}

export interface KBArticleDetailContentData {
  article: {
    content: string | null;
  };
}

export interface KBArticleDetailContentResult {
  statusCode: number | null;
  success: boolean;
  message: string;
  data: KBArticleDetailContentData;
}

export interface KBArticleDetailContentGraphQLData {
  KBArticles: {
    GetArticleDetailContent: KBArticleDetailContentResult;
  };
}

export interface KBArticleDetailInfoGraphQLData {
  KBArticles: {
    GetArticleDetailInfo: {
      statusCode: number | null;
      success: boolean;
      message: string;
      data: Record<string, unknown>;
    };
  };
}

export interface KBArticleRelationsGraphQLData {
  KBMasterCommonData: {
    GetArticleRelations: {
      statusCode: number;
      success: boolean;
      message: string;
      data: { id: number; title: string }[];
    };
  };
}

export interface KBArticleViewGroupGraphQLData {
  KBMasterCommonData: {
    GetArticleViewGroup: {
      statusCode: number;
      success: boolean;
      message: string;
      data: { id: number; title: string }[];
    };
  };
}

export interface KBArticleSourcesGraphQLData {
  KBMasterCommonData: {
    GetArticleSources: {
      statusCode: number;
      success: boolean;
      message: string;
      data: { id: number; title_th: string; title_en: string }[];
    };
  };
}

export interface KBGetEditArticleData {
  artId: number;
  title: string;
  version: number;
  content: string | null;
  description: string | null;
  sourceId: number | null;
  priorityId: number | null;
  ownerId: number | null;
  receiveDate: string | null;
  startDate: string | null;
  expirationDate: string | null;
  categories: { categoryId: number; categoryPath_th: string; categoryPath_en: string }[];
  relatedArticles: { id: number; title: string }[];
  keywords: { id: number; title: string }[];
  viewableGroups: { id: number; title: string }[];
  attachments: { id: number; name: string; path: string; sizeLabel: number; ext: string }[];
}

export interface KBGetEditArticleGraphQLData {
  KBArticles: {
    GetEditArticle: {
      statusCode: number | null;
      success: boolean;
      message: string;
      data: KBGetEditArticleData;
    };
  };
}



export interface KBGetArticleDetailStatusActivityData {

  artId: number;
  title:string;
  description:string;
  sourceId: number;
  sourceName: string;
  sourceNameEn: string;
  status:string;
  version:number;
  priority:string;
  priorityId: number;
  priorityName: string;
  priorityNameEn: string;
  ownerId: number;
  displayName: string;
  receiveDate: string;
  startDate: string;
  ExpirationDate: string;
  createdDate: string;
  lastUpdatedDate: string;
  relatedArticles: {
    id: number;
    title: string;
  }[];
  keywords: string[];
  viewableGroups: string[];
  attachments: {
    name: string;
    path: string;
    sizeLabel: number;
    ext: string;
  }[];
  nextstatus: {
    id: number;
    vaue: string;
    seq: number;
  }[];
  activityLog: {
    id: number;
    action: string;
    actor: string;
    at: string;
    note: string;
  }[];
 
}

export interface KBGetArticleDetailStatusActivityDataResult {
  success: boolean,
  statusCode: number,
  message: string,
  data: KBGetArticleDetailStatusActivityData;

}

export interface KBArticleDetailStatusActivityGraphQLData {
  KBArticles: {
    GetArticleDetailStatusActivityLog: KBGetArticleDetailStatusActivityDataResult;
  };
}



export interface KBArticleCountViewGraphQLData {
  KBArticles: {
    AriticleCountView: {
      message: string;
      data: { artId: number; title: string };
    };
  };
}
