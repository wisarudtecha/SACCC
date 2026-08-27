import {
  ArticleDetailEndpointPrefix,
  ArticleEndpoints,
  General,
  MODE,
} from "@/kms/constant";
import {
  //ArticleAttachment,
  ArticleBlockDataMap,
  ArticleBlockKey,
  ArticleBlockResponse,
 // ArticleCategory,
  ArticleComment,
  ArticleCommentReply,
  ArticleDetail,
  ArticleDetailInfo,
  ArticleFilter,
  ArticleItem,
  // ArticleListResult,
  // ArticleLogEntry,
  // ArticleNextStatusAndActivity
} from "@/kms/articles/dtos/articles.dto";
import {
  type LooseRecord,
  isRecord,
  //pickFirst,
  toNumber,
  toStringValue,
  mapRawAttachment,
  wait,
  getInitials,
  formatddMMyyyy
} from "@/kms/common/common.transform.service";
import {
  KBArticleGraphQLData,
  KBArticleStatusGraphQLData,
  KBArticlePriorityGraphQLData,
  KBArticleUserGraphQLData,
  KBArticleMasterGraphQLData,
  KBArticleDetailHeaderData,
  KBArticleDetailHeaderGraphQLData,
  KBArticleDetailContentGraphQLData,
  KBArticleDetailInfoGraphQLData,
  KBArticleRelationsGraphQLData,
  KBArticleSourcesGraphQLData,
  KBArticleOwnershipGraphQLData,
  KBArticleDetailStatusActivityGraphQLData,
  KBArticleViewGroupGraphQLData,
  KBArticleCountViewGraphQLData
} from '@/kms/articles/dtos/articles-graphql.dto'
import { formatISODateTime } from "@/kms/common/common.transform.service";
import { graphqlRequest } from "@/kms/common/graphql.service";

interface KBListCommentsGraphQLData {
  KBArticleComment: {
    ListComments: {
      statusCode: number;
      success: boolean;
      message: string;
      data: LooseRecord[];
    };
  };
}

interface KBCommentMutationGraphQLData {
  KBArticleComment: {
    AddComment?: { statusCode: number; success: boolean; message: string; data: LooseRecord | null };
    AddReply?: { statusCode: number; success: boolean; message: string; data: LooseRecord | null };
    DeleteComment?: { statusCode: number; success: boolean; message: string; data: LooseRecord | null };
    ToggleLike?: { statusCode: number; success: boolean; message: string; data: { liked: boolean; likecount: number } | null };
  };
}
type BlockValue<K extends ArticleBlockKey> = ArticleBlockDataMap[K];

// const normalizeStatus = (v: unknown): ArticleItem["status"] => {
//   const s = toStringValue(v, "draft");
//   if (s === "published" || s === "review" || s === "draft" || s === "archived")
//     return s;
//   return "draft";
// };

// const normalizePriority = (v: unknown): ArticleItem["priority"] => {
//   const s = toStringValue(v, "medium");
//   if (s === "high" || s === "medium" || s === "low") return s;
//   return "medium";
// };

// const mapCategory = (raw: LooseRecord): ArticleCategory => {
//   const label = toStringValue(pickFirst(raw.label, raw.name, raw.title), "");
//   return {
//     id: toStringValue(pickFirst(raw.id, raw.categoryId), label),
//     label,
//     path: toStringValue(
//       pickFirst(raw.path, raw.breadcrumb, raw.fullPath),
//       label,
//     ),
//   };
// };

// const mapArticleItem = (raw: LooseRecord): ArticleItem => {
//   const categoryRaw = isRecord(raw.category) ? raw.category : {};
//   return {
//     id: toStringValue(pickFirst(raw.id, raw.articleId), ""),
//     articleId: toNumber(pickFirst(raw.id, raw.articleId), -1),
//     status_value: '',
//     title: toStringValue(pickFirst(raw.title, raw.name, raw.subject), ""),
//     description: toStringValue(
//       pickFirst(raw.description, raw.summary, raw.excerpt, raw.body),
//       "",
//     ),
//     status: normalizeStatus(
//       pickFirst(raw.status, raw.articleStatus, raw.state),
//     ),
//     priority: normalizePriority(
//       pickFirst(raw.priority, raw.importance, raw.level),
//     ),
//     version: toStringValue(
//       pickFirst(raw.version, raw.versionNumber, raw.ver),
//       "0.1",
//     ),
//     viewCount: toNumber(pickFirst(raw.viewCount, raw.views, raw.totalViews), 0),
//     rating: toNumber(pickFirst(raw.rating, raw.avgRating, raw.score), 0),
//     ratingMax: toNumber(pickFirst(raw.ratingMax, raw.maxRating), 5),
//     createdAt: toStringValue(
//       pickFirst(raw.createdAt, raw.created_at, raw.createDate),
//       "",
//     ),
//     updatedAt: toStringValue(
//       pickFirst(
//         raw.updatedAt,
//         raw.updated_at,
//         raw.modifiedAt,
//         raw.lastModified,
//       ),
//       "",
//     ),
//     createdBy: toStringValue(
//       pickFirst(raw.createdBy, raw.author, raw.owner, raw.creator),
//       "",
//     ),
//     group: toStringValue(pickFirst(raw.group, raw.groupName, raw.team), ""),
//     score: toNumber(pickFirst(raw.score, raw.totalScore, raw.points), 0),
//     category: mapCategory(categoryRaw),
//   };
// };

// ─── mock data ────────────────────────────────────────────────────────────────



// const applyFilter = (
//   items: ArticleItem[],
//   filter: ArticleFilter,
// ): ArticleItem[] => {
//   let result = [...items];

//   if (filter.search) {
//     const q = filter.search.toLowerCase();
//     result = result.filter(
//       (a) =>
//         a.title.toLowerCase().includes(q) ||
//         a.description.toLowerCase().includes(q),
//     );
//   }
//   if (filter.status && filter.status !== "all") {
//     result = result.filter((a) => a.status === filter.status);
//   }
//   if (filter.priority && filter.priority !== "all") {
//     result = result.filter((a) => a.priority === filter.priority);
//   }
//   if (filter.category) {
//     const q = filter.category.toLowerCase();
//     result = result.filter(
//       (a) =>
//         a.category.label.toLowerCase().includes(q) ||
//         a.category.path.toLowerCase().includes(q),
//     );
//   }
//   if (filter.createdBy) {
//     const q = filter.createdBy.toLowerCase();
//     result = result.filter((a) => a.createdBy.toLowerCase().includes(q));
//   }
//   if (filter.group) {
//     const q = filter.group.toLowerCase();
//     result = result.filter((a) => a.group.toLowerCase().includes(q));
//   }
//   if (filter.version) {
//     result = result.filter((a) => a.version.includes(filter.version!));
//   }

//   // Sort
//   switch (filter.sortBy) {
//     case "oldest":
//       result.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
//       break;
//     case "most_viewed":
//       result.sort((a, b) => b.viewCount - a.viewCount);
//       break;
//     case "highest_rated":
//       result.sort((a, b) => b.rating - a.rating);
//       break;
//     case "title_az":
//       result.sort((a, b) => a.title.localeCompare(b.title));
//       break;
//     default:
//       result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
//   }

//   return result;
// };



/****************************************** */


const ADMIN_ARTICLE_QUERY = `
query GetViewList($input: ViewListInput) {
  KBArticles {
    GetViewList(input: $input) {
      data
    }
  }
}
`;

const adminArticleFromGraphQL = async (
  f?: ArticleFilter
): Promise<{
  items: ArticleItem[];
  total: number;
  page: number;
  pageSize: number;
}> => {

  const articleFilter = {
    search: f?.search,
    categoryId: Number(f?.category),
    startDate: f?.dateFrom,
    endDate: f?.dateTo,
    createdBy: Number(f?.createdBy),
    groupId: f?.group ? Number(f?.group) : null,
    version: Number(f?.version),
    statusId: Number(f?.status),
    priority: Number(f?.priority),
    page: Number(f?.page),
    pageSize: Number(f?.pageSize),
    sortBy: f?.sortBy,
    orderBy: '',
  }

  const res = await graphqlRequest<KBArticleGraphQLData>({
    query: ADMIN_ARTICLE_QUERY,
    variables: {
      input: articleFilter
    },
  });
  const result = res.data.KBArticles.GetViewList.data;
  result.data?.map(m => {
    m.updatedAt = formatISODateTime(m.updatedAt)
    m.createdAt = formatISODateTime(m.createdAt)
  })
  return {
    items: result?.data ? result.data as unknown as ArticleItem[] : [],
    total: result?.total ?? 0,
    page: result?.currentPage ?? 10,
    pageSize: f?.pageSize ?? 10
  };

};





const ADMIN_ARTICLE_STATUS_QUERY = `
 query GetArticleStatus {
    KBMasterCommonData {
      GetArticleStatus {
        data
      }
    }
  }
`;

const adminArticleStatusFromGraphQL = async (): Promise<{
  success: boolean,
  statusCode: number,
  message: string,
  data: {
    statusId: number,
    name_th: string,
    name_en: string,
    value: string
  }[];
}> => {

  const res = await graphqlRequest<KBArticleStatusGraphQLData>({
    query: ADMIN_ARTICLE_STATUS_QUERY,
  });
  const result = res.data.KBMasterCommonData.GetArticleStatus;
  return result;

};


const ADMIN_ARTICLE_PRIORITY_QUERY = `
  query {
    KBMasterCommonData {
      GetArticlePriority {
        statusCode
        success
        message
        data
      }
    }
  }
`;

const adminArticlePriorityFromGraphQL = async (): Promise<{
  statusCode: number;
  success: boolean | null;
  message: string;
  data: { priorityId: number; name_th: string; name_en: string; value: string }[];
}> => {
  const res = await graphqlRequest<KBArticlePriorityGraphQLData>({
    query: ADMIN_ARTICLE_PRIORITY_QUERY,
  });
  return res.data.KBMasterCommonData.GetArticlePriority;
};


const ADMIN_ARTICLE_USER_QUERY = `
 query GetAllUser {
    KBMasterCommonData {
      GetAllUser {
        data
      }
    }
  }
`;

const adminArticleAllUserFromGraphQL = async (): Promise<{
  success: boolean,
  statusCode: number,
  message: string,
  data: {
    id: number,
    firstName: string,
    lastName: string,
    fullName: string
  }[];
}> => {
  const res = await graphqlRequest<KBArticleUserGraphQLData>({
    query: ADMIN_ARTICLE_USER_QUERY,
  });
  const result = res.data.KBMasterCommonData.GetAllUser
  return result;

};

const ADMIN_ARTICLE_MASTER_DATA_QUERY = `
 query GetGeneralMasterData($input: GeneralMasterDataInput) {
    KBMasterCommonData {
      GetGeneralMasterData(input: $input) {
        data
      }
    }
  }
`;

const adminArticleMasterDataFromGraphQL = async (f: {
  item_key: string
}): Promise<{
  success: boolean,
  statusCode: number,
  message: string,
  data: {
    id: number,
    item_name: string,
    item_value: string
  }[];
}> => {
  const res = await graphqlRequest<KBArticleMasterGraphQLData>({
    query: ADMIN_ARTICLE_MASTER_DATA_QUERY,
    variables: {
      input: f
    },
  });
  const result = res.data.KBMasterCommonData.GetGeneralMasterData
  return result;

};



/****************************************** */








const fetchApiBlock = async <K extends ArticleBlockKey>(
  _block: K,
  filter?: ArticleFilter,
): Promise<BlockValue<K>> => {
  return adminArticleFromGraphQL(filter ?? {}) as Promise<BlockValue<K>>;
};




// ─── public API ───────────────────────────────────────────────────────────────

export const getArticleBlock = async <K extends ArticleBlockKey>(
  block: K,
  filter?: ArticleFilter,
): Promise<ArticleBlockResponse<BlockValue<K>>> => {
  const source = General.ARTICLE_DATA_SOURCE;
  const endpoint = ArticleEndpoints[block];
  const data = await fetchApiBlock(block, filter)
  return { data, meta: { key: block, endpoint, source } };
};



export const getArticleStatus = async (): Promise<{
  success: boolean,
  statusCode: number,
  message: string,
  data: {
    statusId: number,
    name_th: string,
    name_en: string,
    value: string
  }[];
}> => {
  const data = await adminArticleStatusFromGraphQL()
  return data;
};


export const getArticlePriority = async (): Promise<{
  statusCode: number;
  success: boolean | null;
  message: string;
  data: { priorityId: number; name_th: string; name_en: string; value: string }[];
}> => {
  return adminArticlePriorityFromGraphQL();
};


export const getArticleAllUser = async (): Promise<{
  success: boolean,
  statusCode: number,
  message: string,
  data: {
    id: number,
    firstName: string,
    lastName: string,
    fullName: string
  }[];
}> => {
  const data = await adminArticleAllUserFromGraphQL()
  return data;
};

const ARTICLE_OWNERSHIP_QUERY = `
  query {
    KBMasterCommonData {
      GetArticleOwnership {
        statusCode
        success
        message
        data
      }
    }
  }
`;

export const getArticleOwnership = async (): Promise<{
  statusCode: number;
  success: boolean | null;
  message: string;
  data: { id: number; firstName: string; lastName: string; fullName: string }[];
}> => {
  const res = await graphqlRequest<KBArticleOwnershipGraphQLData>({
    query: ARTICLE_OWNERSHIP_QUERY,
  });
  return res.data.KBMasterCommonData.GetArticleOwnership;
};



export const getArticleMasterData = async (f: {
  item_key: string
}): Promise<{
  success: boolean,
  statusCode: number,
  message: string,
  data: {
    id: number,
    item_name: string,
    item_value: string
  }[];
}> => {
  const data = await adminArticleMasterDataFromGraphQL(f)
  return data;
};


const ADMIN_ARTICLE_DETAIL_STATUS_ACTIVITY_QUERY = `
  query GetArticleDetailStatusActivityLog($input: ArticleEditInput) {
    KBArticles {
      GetArticleDetailStatusActivityLog(input: $input) {
        success
        message
        data
      }
    }
  }
`;



export interface ArticleDetailStatusActivity {
  artId: number;
  title: string;
  description: string;
  status: string;
  status_value: string;
  version: number;
  sourceId: number;
  sourceName: string;
  sourceNameEn: string;
  priority: string;
  priorityId: number;
  priorityName: string;
  priorityNameEn: string;
  ownerId: number;
  ownership: string;
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
    action_name_th: string;
    action_name_en: string;
  }[];
  activityLog: {
    id: number;
    action: string;
    actor: string;
    at: string;
    note: string;
  }[];
}

export const getArticleDetailStatusActivity = async (artid: number): Promise<ArticleDetail> => {
  const data = await adminArticleDetailStatusActivityFromGraphQL(artid)
  return data;
};

const adminArticleDetailStatusActivityFromGraphQL = async (artid: number): Promise<ArticleDetail> => {
  const variables = {
    input: {
      id: artid,
    },
  };
  const res = await graphqlRequest<KBArticleDetailStatusActivityGraphQLData>({
    query: ADMIN_ARTICLE_DETAIL_STATUS_ACTIVITY_QUERY,
    variables
  });
  const result = res.data.KBArticles.GetArticleDetailStatusActivityLog.data as any;

  const articleDetail: ArticleDetail = {
    ...result,
  };
  return articleDetail


  //result as ArticleDetail

};


export const getArticleNextStatusAndActivityLogs = async (artid: number): Promise<ArticleDetail> => {
  return getArticleDetailStatusActivity(artid)
}


export const getArticleDetailInfo = async (artId: number): Promise<ArticleDetailInfo | null> => {

  const res = await graphqlRequest<KBArticleDetailInfoGraphQLData>({
    query: `query { KBArticles { GetArticleDetailInfo(input: { artId: ${artId} }) { statusCode success message data } } }`,
  });
  const result = res.data?.KBArticles?.GetArticleDetailInfo;
  if (!result?.success || !isRecord(result.data)) return null;
  const d = result.data;
  const rawAttachments = Array.isArray(d.attachments) ? (d.attachments as unknown[]).filter(isRecord) : [];
  const rawRelated = Array.isArray(d.relatedArticles) ? (d.relatedArticles as unknown[]).filter(isRecord) : [];

  return {
    sourceName: toStringValue(d.sourceName),
    priorityName: toStringValue(d.priorityName),
    displayName: d.displayName != null ?  toStringValue(d.displayName) : null,
    receiveDate: d.receiveDate != null ? formatddMMyyyy(toStringValue(d.receiveDate)) : null,
    startDate: d.startDate != null ? formatddMMyyyy(toStringValue(d.startDate)) : null,
    expirationDate: d.ExpirationDate != null ? formatddMMyyyy(toStringValue(d.ExpirationDate)) : null,
    relatedArticles: rawRelated.map((r) => ({
      id: toStringValue(r.id),
      title: toStringValue(r.title),
    })),
    keywords: Array.isArray(d.keywords) ? (d.keywords as unknown[]).map((k) => toStringValue(k)) : [],
    viewableGroups: Array.isArray(d.viewableGroups) ? (d.viewableGroups as unknown[]).map((g) => toStringValue(g)) : [],
    attachments: rawAttachments.map(mapRawAttachment),
  };
};

export const getArticleDetailContent = async (artId: number): Promise<string | null> => {
  const res = await graphqlRequest<KBArticleDetailContentGraphQLData>({
    query: `query { KBArticles { GetArticleDetailContent(input: { artId: ${artId} }) { statusCode success message data } } }`,
  });
  const result = res.data?.KBArticles?.GetArticleDetailContent;
  if (!result?.success) return null;
  return result.data?.article?.content ?? null;
};

export const getArticleDetailHeader = async (artId: number): Promise<KBArticleDetailHeaderData | null> => {
  const res = await graphqlRequest<KBArticleDetailHeaderGraphQLData>({
    query: `query { KBArticles { GetArticleDetailHeader(input: { artId: ${artId} }) { statusCode success message data } } }`,
  });
  const result = res.data?.KBArticles?.GetArticleDetailHeader;
  if (!result?.success) return null;

 //result.data.createdDate =  formatISODateTime(result.data?.createdDate)
//  result.data.updatedDate =  formatISODateTime(result.data?.updatedDate)
//  console.log(result.data)
  return result.data;
};

const getArticleCommentsFromApi = async (artId: number): Promise<ArticleComment[]> => {
  const res = await graphqlRequest<KBListCommentsGraphQLData>({
    query: `query { KBArticleComment { ListComments(input: { artId: ${artId} }) { statusCode success message data } } }`,
  });
  const result = res.data?.KBArticleComment?.ListComments;
  if (!result?.success || !Array.isArray(result.data)) return [];

  return result.data.filter(isRecord).map((raw): ArticleComment => {
    const rawReplies = Array.isArray(raw.replies) ? (raw.replies as unknown[]).filter(isRecord) : [];
    const author = toStringValue(raw.author);
    return {
      id: String(raw.id ?? ""),
      author,
      authorInitials: getInitials(author),
      content: toStringValue(raw.content),
      rating: 0,
      ratingCount: 0,
      myRating: 0,
      likes: toNumber(raw.likecount ?? raw.likes, 0),
      likedByMe: raw.likebyme === true,
      createdAt: toStringValue(raw.createdDate ?? raw.createdAt),
      replies: rawReplies.map((r): ArticleCommentReply => {
        const replyAuthor = toStringValue(r.author);
        return {
          id: String(r.id ?? ""),
          author: replyAuthor,
          authorInitials: replyAuthor ? getInitials(replyAuthor) : "?",
          content: toStringValue(r.content),
          likes: toNumber(r.likecount ?? r.likes, 0),
          likedByMe: r.likebyme === true,
          createdAt: toStringValue(r.createdAt ?? r.createdDate),
        };
      }),
    };
  });
};

export const getArticleComments = async (
  articleId: string,
  artId?: number,
): Promise<ArticleComment[]> => {
  articleId = articleId ?? "";
  if (artId && artId > 0) {
    return getArticleCommentsFromApi(artId);
  }
  return [];
};

// ─── Add Comment ──────────────────────────────────────────────────────────

export interface AddCommentPayload {
  articleId: string;
  artId?: number;
  content: string;
}

export interface AddCommentResponse {
  success: boolean;
  message: string;
  comment?: ArticleComment;
}

const mockAddComment = async (
  payload: AddCommentPayload,
): Promise<AddCommentResponse> => {
  if (General.MODE === MODE.LOCAL) await wait(400);

  if (!payload.content.trim()) {
    return {
      success: false,
      message: "Comment cannot be empty",
    };
  }

  const newComment: ArticleComment = {
    id: `c-${Date.now()}`,
    author: "Current User",
    authorInitials: "CU",
    content: payload.content,
    rating: 0,
    ratingCount: 0,
    myRating: 0,
    likes: 0,
    likedByMe: false,
    createdAt: new Date().toLocaleString(),
    replies: [],
  };

  return {
    success: true,
    message: "Comment added successfully",
    comment: newComment,
  };
};

const mapCommentData = (raw: LooseRecord): ArticleComment => {
  const author = toStringValue(raw.author);
  const rawReplies = Array.isArray(raw.replies) ? (raw.replies as unknown[]).filter(isRecord) : [];
  return {
    id: String(raw.id ?? ""),
    author,
    authorInitials: getInitials(author),
    content: toStringValue(raw.content),
    rating: 0, ratingCount: 0, myRating: 0,
    likes: toNumber(raw.likecount ?? raw.likes, 0),
    likedByMe: raw.likebyme === true,
    createdAt: toStringValue(raw.createdDate ?? raw.createdAt),
    replies: rawReplies.map((r): ArticleCommentReply => {
      const ra = toStringValue(r.author);
      return {
        id: String(r.id ?? ""),
        author: ra,
        authorInitials: ra ? getInitials(ra) : "?",
        content: toStringValue(r.content),
        likes: toNumber(r.likecount ?? r.likes, 0),
        likedByMe: r.likebyme === true,
        createdAt: toStringValue(r.createdDate ?? r.createdAt),
      };
    }),
  };
};

const addCommentFromApi = async (
  payload: AddCommentPayload,
): Promise<AddCommentResponse> => {
  const artId = payload.artId ?? (Number(payload.articleId.replace(/\D+/g, "")) || 0);
  const res = await graphqlRequest<KBCommentMutationGraphQLData>({
    query: `query { KBArticleComment { AddComment(input: { artId: ${artId}, content: "${payload.content.replace(/"/g, '\\"')}" }) { statusCode success message data } } }`,
  });
  const result = res.data?.KBArticleComment?.AddComment;
  if (!result?.success) throw new Error(result?.message ?? "Failed to add comment");
  const comment = isRecord(result.data) ? mapCommentData(result.data) : undefined;
  return { success: true, message: result.message, comment };
};

export const addComment = async (
  payload: AddCommentPayload,
): Promise<AddCommentResponse> => {
  return General.ARTICLE_DATA_SOURCE === "api"
    ? addCommentFromApi(payload)
    : mockAddComment(payload);
};

// ─── Add Reply ────────────────────────────────────────────────────────────

export interface AddReplyPayload {
  articleId: string;
  artId?: number;
  commentId: string;
  content: string;
}

export interface AddReplyResponse {
  success: boolean;
  message: string;
  reply?: ArticleComment["replies"][0];
}

const mockAddReply = async (
  payload: AddReplyPayload,
): Promise<AddReplyResponse> => {
  if (General.MODE === MODE.LOCAL) await wait(400);

  if (!payload.content.trim()) {
    return {
      success: false,
      message: "Reply cannot be empty",
    };
  }

  const newReply: ArticleComment["replies"][0] = {
    id: `r-${Date.now()}`,
    author: "Current User",
    authorInitials: "CU",
    content: payload.content,
    likes: 0,
    likedByMe: false,
    createdAt: new Date().toLocaleString(),
  };

  return {
    success: true,
    message: "Reply added successfully",
    reply: newReply,
  };
};

const addReplyFromApi = async (
  payload: AddReplyPayload,
): Promise<AddReplyResponse> => {
  const artId = payload.artId ?? (Number(payload.articleId.replace(/\D+/g, "")) || 0);
  const commentId = Number(payload.commentId) || 0;
  const res = await graphqlRequest<KBCommentMutationGraphQLData>({
    query: `query { KBArticleComment { AddReply(input: { artId: ${artId}, commentId: ${commentId}, content: "${payload.content.replace(/"/g, '\\"')}" }) { statusCode success message data } } }`,
  });
  const result = res.data?.KBArticleComment?.AddReply;
  if (!result?.success) throw new Error(result?.message ?? "Failed to add reply");
  const raw = isRecord(result.data) ? result.data : null;
  const reply: ArticleCommentReply | undefined = raw ? {
    id: String(raw.id ?? ""),
    author: toStringValue(raw.author),
    authorInitials: raw.author ? getInitials(toStringValue(raw.author)) : "?",
    content: toStringValue(raw.content),
    likes: toNumber(raw.likecount ?? raw.likes, 0),
    likedByMe: raw.likebyme === true,
    createdAt: toStringValue(raw.createdDate ?? raw.createdAt),
  } : undefined;
  return { success: true, message: result.message, reply };
};

export const addReply = async (
  payload: AddReplyPayload,
): Promise<AddReplyResponse> => {
  return General.ARTICLE_DATA_SOURCE === "api"
    ? addReplyFromApi(payload)
    : mockAddReply(payload);
};

export const deleteComment = async (id: string): Promise<{ success: boolean }> => {
  if (General.ARTICLE_DATA_SOURCE !== "api") return { success: true };
  const res = await graphqlRequest<KBCommentMutationGraphQLData>({
    query: `query { KBArticleComment { DeleteComment(input: { id: ${Number(id)} }) { statusCode success message data } } }`,
  });
  const result = res.data?.KBArticleComment?.DeleteComment;
  return { success: result?.success ?? false };
};

export const toggleLikeComment = async (
  commentId: string,
  liked: boolean,
): Promise<{ success: boolean; likecount: number; liked: boolean } | null> => {
  const res = await graphqlRequest<KBCommentMutationGraphQLData>({
    query: `query { KBArticleComment { ToggleLike(input: { commentId: ${Number(commentId)}, liked: ${liked} }) { statusCode success message data } } }`,
  });
  const result = res.data?.KBArticleComment?.ToggleLike;
  if (!result?.success || !result.data) return null;
  return { success: true, likecount: result.data.likecount, liked: result.data.liked };
};



// ─── Cover Image Management ────────────────────────────────────────────────

export interface CoverImageActionPayload {
  articleId: string;
  action: "delete" | "copy" | "download" | "edit";
  imagePath?: string;
  newImagePath?: string;
  note?: string;
}

export interface CoverImageUpdateResponse {
  success: boolean;
  message: string;
  articleId: string;
  coverImage?: string;
}


const updateCoverImageFromApi = async (
  payload: CoverImageActionPayload,
): Promise<CoverImageUpdateResponse> => {
  const url = `${General.API_BASE_URL}${ArticleDetailEndpointPrefix}/${payload.articleId}/cover-image`;
  const response = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to update cover image");
  }

  return response.json() as Promise<CoverImageUpdateResponse>;
};

export const updateCoverImage = async (
  payload: CoverImageActionPayload,
): Promise<CoverImageUpdateResponse> => {
  return updateCoverImageFromApi(payload)
};

// ─── Article Actions ──────────────────────────────────────────────────────────

export interface ArticleActionResponse {
  success: boolean;
  message: string;
  articleId?: string;
  redirectId?: string;
  data?: {
    id?: number;
  }

}


export interface ArticleEDITResponse {
  success: boolean;
  message: string;
  data?: {
    id?: number;
  }

}







export const deleteArticle = (id: string): Promise<ArticleActionResponse> => deleteArticleFromGraphQL(id)


export const CLONE_ARTICLE_QUERY = `
  query ArticleClone($input: ArticleCloneInput) {
    KBArticles {
      ArticleClone(input: $input) {
        statusCode
        success
        message
        data
      }
    }
  }
`;

const duplicateArticleFromApi = async (
  id: string,
): Promise<ArticleActionResponse> => {
  const res = await graphqlRequest<{
    KBArticles: {
      ArticleClone: ArticleActionResponse;
    };
  }>({
    query: CLONE_ARTICLE_QUERY,
    variables: {
      input: {
        id: Number(id),
      },
    },
  });
  return res.data.KBArticles.ArticleClone;
};


export const GET_ARTICLE_NEW_VERSION_QUERY = `
  query GetArticleNewVersion($input: ArticleEditInput) {
    KBArticles {
      GetArticleNewVersion(input: $input) {
        statusCode
        success
        message
        data
      }
    }
  }
`;

export const getArticleNewVersion = async (
  id: string,
): Promise<ArticleActionResponse> => {
  const res = await graphqlRequest<{
    KBArticles: {
      GetArticleNewVersion: ArticleActionResponse;
    };
  }>({
    query: GET_ARTICLE_NEW_VERSION_QUERY,
    variables: {
      input: {
        id: Number(id),
      },
    },
  });
  return res.data.KBArticles.GetArticleNewVersion;
};



export const CERTIFY_EDIT_ARTICLE_QUERY = `
  query AriticleEditToDraf($input: ArticleEditInput) {
    KBArticles {
      AriticleEditToDraf(input: $input) {
        statusCode
        success
        message
        data
      }
    }
  }
`;

const certifyEditArticle = async (
  id: string,
): Promise<ArticleEDITResponse> => {
  const res = await graphqlRequest<{
    KBArticles: {
      AriticleEditToDraf: ArticleEDITResponse;
    };
  }>({
    query: CERTIFY_EDIT_ARTICLE_QUERY,
    variables: {
      input: {
        id: Number(id),
      },
    },
  });

  return res.data.KBArticles.AriticleEditToDraf;
};


export const duplicateArticle = (id: string): Promise<ArticleActionResponse> => duplicateArticleFromApi(id)



export const certifyArticle = (id: string): Promise<ArticleEDITResponse> => certifyEditArticle(id)



const submitForApprovalFromApi = async (
  id: string,
): Promise<ArticleActionResponse> => {
  const url = `${General.API_BASE_URL}${ArticleDetailEndpointPrefix}/${id}/submit`;
  const response = await fetch(url, { method: "PATCH" });
  if (!response.ok) throw new Error("Failed to submit for approval");
  return response.json() as Promise<ArticleActionResponse>;
};

export const submitForApproval = (
  id: string,
): Promise<ArticleActionResponse> => submitForApprovalFromApi(id)



const setPendingEditorFromApi = async (
  id: string,
): Promise<ArticleActionResponse> => {
  const url = `${General.API_BASE_URL}${ArticleDetailEndpointPrefix}/${id}/pending-editor`;
  const response = await fetch(url, { method: "PATCH" });
  if (!response.ok) throw new Error("Failed to set pending editor");
  return response.json() as Promise<ArticleActionResponse>;
};

export const setPendingEditor = (id: string): Promise<ArticleActionResponse> => setPendingEditorFromApi(id)

// ─── Article Rating ───────────────────────────────────────────────────────────

interface ArticleRatingGraphQLData {
  KBArticleComment: {
    GetArticleRating: {
      data: {
        averageRating: number;
        totalVoters: number;
        myRating: { artRatingId: number; rating: number } | null;
      };
    };
  };
}

interface AddRatingGraphQLData {
  KBArticleComment: {
    AddRating: {
      statusCode: number;
      success: boolean;
      message: string;
      data: { artRatingId: number; artId: number; rating: number } | null;
    };
  };
}

interface UpdateRatingGraphQLData {
  KBArticleComment: {
    UpdateRating: {
      statusCode: number;
      success: boolean;
      message: string;
      data: { artRatingId: number; artId: number; rating: number } | null;
    };
  };
}

export interface ArticleRatingData {
  averageRating: number;
  totalVoters: number;
  myRating: { artRatingId: number; rating: number } | null;
}

export const getArticleRating = async (artId: number): Promise<ArticleRatingData | null> => {
  const res = await graphqlRequest<ArticleRatingGraphQLData>({
    query: `query { KBArticleComment { GetArticleRating(input: { artId: ${artId} }) { data } } }`,
  });
  return res.data?.KBArticleComment?.GetArticleRating?.data ?? null;
};

export const addRating = async (
  artId: number,
  rating: number,
): Promise<{ success: boolean; artRatingId: number | null }> => {
  const res = await graphqlRequest<AddRatingGraphQLData>({
    query: `query { KBArticleComment { AddRating(input: { artId: ${artId}, rating: ${rating} }) { statusCode success message data } } }`,
  });
  const result = res.data?.KBArticleComment?.AddRating;
  return {
    success: result?.success ?? false,
    artRatingId: result?.data?.artRatingId ?? null,
  };
};

export const updateRating = async (
  id: number,
  rating: number,
): Promise<{ success: boolean }> => {
  const res = await graphqlRequest<UpdateRatingGraphQLData>({
    query: `query { KBArticleComment { UpdateRating(input: { id: ${id}, rating: ${rating} }) { statusCode success message data } } }`,
  });
  const result = res.data?.KBArticleComment?.UpdateRating;
  return { success: result?.success ?? false };
};

// ─── Change Header Image ──────────────────────────────────────────────────────

const CHANGE_HEADER_IMAGE_QUERY = `
  query ChangeHeaderImage($id: Int!, $coverImgUrl: String!) {
    KBArticles {
      ChangeHeaderImage(input: { id: $id, coverImgUrl: $coverImgUrl }) {
        statusCode
        success
        message
        data
      }
    }
  }
`;

interface ChangeHeaderImageGraphQLData {
  KBArticles: {
    ChangeHeaderImage: {
      statusCode: number;
      success: boolean;
      message: string;
      data: unknown;
    };
  };
}

export const changeHeaderImage = async (
  artId: number,
  coverImgUrl: string,
): Promise<{ success: boolean; message: string }> => {
  const res = await graphqlRequest<ChangeHeaderImageGraphQLData>({
    query: CHANGE_HEADER_IMAGE_QUERY,
    variables: { id: artId, coverImgUrl },
  });
  const result = res.data.KBArticles.ChangeHeaderImage;
  return { success: result.success, message: result.message };
};

// ─── Article Relations ────────────────────────────────────────────────────────

const ARTICLE_RELATIONS_QUERY = `
  query {
    KBMasterCommonData {
      GetArticleRelations {
        statusCode
        success
        message
        data
      }
    }
  }
`;

export const getArticleRelations = async (): Promise<{
  success: boolean;
  statusCode: number;
  message: string;
  data: { id: number; title: string }[];
}> => {
  if (General.ARTICLE_DATA_SOURCE !== "api") {
    return { success: true, statusCode: 200, message: "ok", data: [] };
  }
  const res = await graphqlRequest<KBArticleRelationsGraphQLData>({
    query: ARTICLE_RELATIONS_QUERY,
  });
  return res.data.KBMasterCommonData.GetArticleRelations;
};


// ─── Article Sources ──────────────────────────────────────────────────────────

const ARTICLE_SOURCES_QUERY = `
  query {
    KBMasterCommonData {
      GetArticleSources {
        statusCode
        success
        message
        data
      }
    }
  }
`;

export const getArticleSources = async (): Promise<{
  statusCode: number;
  success: boolean;
  message: string;
  data: { id: number; title_th: string; title_en: string }[];
}> => {
  if (General.ARTICLE_DATA_SOURCE !== "api") {
    return { statusCode: 200, success: true, message: "ok", data: [] };
  }
  const res = await graphqlRequest<KBArticleSourcesGraphQLData>({
    query: ARTICLE_SOURCES_QUERY,
  });
  return res.data.KBMasterCommonData.GetArticleSources;
};


export const DELETE_ARTICLE_QUERY = `
  query DeleteArticle($input: DeleteArticleInput) {
    KBArticles {
      DeleteArticle(input: $input) {
        success
        message
        data
      }
    }
  }
`;

const deleteArticleFromGraphQL = async (
  id: string,
): Promise<ArticleActionResponse> => {
  const res = await graphqlRequest<{
    KBArticles: {
      DeleteArticle: ArticleActionResponse;
    };
  }>({
    query: DELETE_ARTICLE_QUERY,
    variables: {
      input: {
        id: Number(id),
      },
    },
  });
  return res.data.KBArticles.DeleteArticle;
};


const ARTICLE_VIEW_GROUP_QUERY = `
  query {
    KBMasterCommonData {
      GetArticleViewGroup {
        statusCode
        success
        message
        data
      }
    }
  }
`;

export const getArticleViewGroup = async (): Promise<{
  success: boolean;
  statusCode: number;
  message: string;
  data: { id: number; title: string }[];
}> => {
  if (General.ARTICLE_DATA_SOURCE !== "api") {
    return { success: true, statusCode: 200, message: "ok", data: [] };
  }
  const res = await graphqlRequest<KBArticleViewGroupGraphQLData>({
    query: ARTICLE_VIEW_GROUP_QUERY,
  });
  return res.data.KBMasterCommonData.GetArticleViewGroup;
};

export const ARTICLE_COUNT_VIEW_QUERY = `
  query ($id: Int) {
    KBArticles {
      AriticleCountView(input: { id: $id }) {
        message
        data
      }
    }
  }
`;

export const putArticleCountView = async (id: number): Promise<{
  message: string;
  data: { artId: number; title: string };
}> => {

  const res = await graphqlRequest<KBArticleCountViewGraphQLData>({
    query: ARTICLE_COUNT_VIEW_QUERY,
    variables: {
      id: Number(id)
    },
  });
  return res.data.KBArticles.AriticleCountView;
};