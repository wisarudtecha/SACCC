import { General, /*MODE*/ } from "@/kms/constant";
import type {
  ArticleFormDetail,
  ArticleFormInput,
  ArticleFormResponse,
  ArticleFormResult,
  //ArticleFormStep,
  ArticleStatusInput,
  ArticleStatusResult
} from "@/kms/articles-create-update/dtos/article-form.dto";
import { graphqlRequest } from "@/kms/common/graphql.service";
import type {
  KBGetEditArticleData,
  KBGetEditArticleGraphQLData,
} from "@/kms/articles/dtos/articles-graphql.dto";

interface KBUpdateArticleGraphQLData {
  KBArticles: {
    UpdateArticle: {
      success: boolean;
      message: string;
      data: { artId: number } | null;
    };
  };
}

interface KBCreateArticleGraphQLData {
  KBArticles: {
    CreateArticle: {
      success: boolean;
      message: string;
      data: { artId: number } | null;
    };
  };
}


interface KBUpdateArticleStatusGraphQLData {
  KBArticles: {
    UpdateArticleStatus: {
      success: boolean;
      message: string;
      data: { id: number } | null;
    };
  };
}
 
import {
 /* type*/ /*LooseRecord,
  isRecord,
  pickFirst,*/
  //toStringValue,
  /*toStringArray,
  toNumberArray,
  toNumberOrNull,
  toAttachmentArray,
  toKeywordArray,*/
  formatBytes,
  // toFormDate,
  // wait,
  // formatISODateTime,
  formatddMMyyyy
} from "@/kms/common/common.transform.service";

// const normalizeStep = (v: unknown): ArticleFormStep => {
//   const s = toStringValue(v, "create");
//   if (s === "create" || s === "submit" || s === "approve" || s === "publish")
//     return s;
//   return "create";
// };

 
  

const GET_EDIT_ARTICLE_QUERY = `
  query GetEditArticle($id: Int!) {
    KBArticles {
      GetEditArticle(input: { id: $id }) {
        statusCode
        success
        message
        data
      }
    }
  }
`;

const mapGraphQLDetail = (d: KBGetEditArticleData, rawId: string): ArticleFormDetail => ({
  id: rawId,
  title: d.title ?? "",
  version: d.version != null ? String(d.version) : "1",
  description: d.description ?? "",
  priority: d.priorityId ?? null,
  source: d.sourceId ?? null,
  reserveDate:formatddMMyyyy(d.receiveDate) ,//  toFormDate(d.receiveDate),
  ownership: d.ownerId ?? null,
  relatedArticles: (d.relatedArticles ?? []).map((a) => a.id),
  relatedArticleOptions: (d.relatedArticles ?? []).map((a) => ({ id: a.id, title: a.title ?? String(a.id) })),
  categoryKey: d.categories?.[0]?.categoryId != null ? String(d.categories[0].categoryId) : "",
  attachments: (d.attachments ?? []).map((a) => ({ id: a.id, name: a.name, path: a.path, sizeLabel: formatBytes(a.sizeLabel) })),
  content: d.content ?? "",
  startDate:formatddMMyyyy(d.startDate) , // toFormDate(d.startDate),
  endDate: formatddMMyyyy(d.expirationDate) ,// toFormDate(d.expirationDate),
  viewableGroups: (d.viewableGroups ?? []).map((a) => a.id),
  viewGroupArticleOptions: (d.viewableGroups ?? []).map((a) => ({ id: a.id, title: a.title ?? String(a.id) })),
  keywords: (d.keywords ?? []).reduce<{ id?: number; title: string }[]>((acc, k) => {
    if (k.title && !acc.some((x) => x.title === k.title)) acc.push({ id: k.id, title: k.title });
    return acc;
  }, []),
  step: "create",
  createdAt: "",
  updatedAt: "",
});

const getApiDetail = async (id: string): Promise<ArticleFormDetail> => {
  const artId = Number(id.replace(/\D+/g, "")) || 0;
  const res = await graphqlRequest<KBGetEditArticleGraphQLData>({
    query: GET_EDIT_ARTICLE_QUERY,
    variables: { id: artId },
  });
  const result = res.data?.KBArticles?.GetEditArticle;

  console.log('result.data',result.data)
  if (!result?.data) throw new Error(result?.message ?? "Article not found");
  return mapGraphQLDetail(result.data, id);
};

const UPDATE_ARTICLE_QUERY = `
  query UpdateArticle($input: ArticleUpdateInput) {
    KBArticles {
      UpdateArticle(input: $input) {
        success
        message
        data
      }
    }
  }
`;

const CREATE_ARTICLE_QUERY = `
  query CreateArticle($input: ArticleCreateInput) {
    KBArticles {
      CreateArticle(input: $input) {
        success
        message
        data
      }
    }
  }
`;

const createApi = async (
  input: ArticleFormInput,
): Promise<ArticleFormResult> => {

  const res = await graphqlRequest<KBCreateArticleGraphQLData>({
    query: CREATE_ARTICLE_QUERY,
    variables: {
      input: {
        title: input.title,
        version: input.version,
        description: input.description,
        priority: input.priority,
        source: input.source,
        reserveDate: input.reserveDate,
        ownership: input.ownership,
        relatedArticles: input.relatedArticles,
        categoryKey: input.categoryKey,
        attachments: input.attachments,
        content: input.content,
        startDate: input.startDate,
        endDate: input.endDate,
        viewableGroups: input.viewableGroups,
        keywords: input.keywords,
      },
    },
  });
  const result = res.data?.KBArticles?.CreateArticle;
  if (!result?.success) throw new Error(result?.message ?? "Unable to update article");
  return { id: String(result.data?.artId), title: input.title, step: "create", createdAt: "" };
 
};

const updateApi = async (
  id: string,
  input: ArticleFormInput,
): Promise<ArticleFormResult> => {
  const artId = Number(id.replace(/\D+/g, "")) || 0;
  const res = await graphqlRequest<KBUpdateArticleGraphQLData>({
    query: UPDATE_ARTICLE_QUERY,
    variables: {
      input: {
        artId,
        title: input.title,
        version: input.version,
        description: input.description,
        priority: input.priority,
        source: input.source,
        reserveDate: input.reserveDate,
        ownership: input.ownership,
        relatedArticles: input.relatedArticles,
        categoryKey: input.categoryKey,
        attachments: input.attachments,
        content: input.content,
        startDate: input.startDate,
        endDate: input.endDate,
        viewableGroups: input.viewableGroups,
        keywords: input.keywords,
      },
    },
  });
  const result = res.data?.KBArticles?.UpdateArticle;
  if (!result?.success) throw new Error(result?.message ?? "Unable to update article");
  return { id, title: input.title, step: "create", createdAt: "" };
};


const UPDATE_ARTICLE__STATUS_QUERY = `
  query UpdateArticle($input: ArticleUpdateStatusInput) {
    KBArticles {
      UpdateArticleStatus(input: $input) {
        success
        message
        data
      }
    }
  }
`;

const updateArticleStatus = async (
  input: ArticleStatusInput
): Promise<ArticleStatusResult> => {

 
  const res = await graphqlRequest<KBUpdateArticleStatusGraphQLData>({
    query: UPDATE_ARTICLE__STATUS_QUERY,
    variables: {
      input: {
        id: input.id,
        comment: input.comment,
        status_id: input.status_id
      },
    },
  });
  const result = res.data?.KBArticles?.UpdateArticleStatus;
  if (!result?.success) throw new Error(result?.message ?? "Unable to update article status");
  return { id: input.id.toString() };
};


// ─── public API ───────────────────────────────────────────────────────────────

export const getArticleFormDetail = async (
  id: string,
): Promise<ArticleFormDetail> => {
  return getApiDetail(id);
};

export const saveArticleForm = async (
  input: ArticleFormInput,
  editId?: string,
): Promise<ArticleFormResponse> => {
  const source = General.ARTICLE_DATA_SOURCE;
  const endpoint = editId
    ? `${General.ARTICLE_UPDATE_ENDPOINT_PREFIX}/${editId}`
    : General.ARTICLE_CREATE_ENDPOINT;

  const data = editId
        ? await updateApi(editId, input)
        : await createApi(input)
  return { data, meta: { endpoint, source } };
};


export const saveArticleStatus = async (
  input: ArticleStatusInput,
): Promise<{ id: string; }> => {
  const data = await updateArticleStatus(input);
  return data;
}
