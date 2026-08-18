 
import type {
  BannerItem,
  BannerActionResponse,
  BannerMutationInput,
  BannerReorderResponse,
  ArticleFilter,
  BannerArticleResponse,
} from "@/kms/banner/dtos/banner.dto"// "../dtos/banner.dto";

import { graphqlRequest } from "@/kms/common/graphql.service";
import {
  KBBannerGraphQLData,
  KBBannerManageGraphQLData,
  KBBannerGetArticleGraphQLData,
} from "@/kms/banner/dtos/banner-graphql.dto";

// ─── GraphQL Queries ──────────────────────────────────────────────────────────

const GET_BANNER_LIST_QUERY = `
query  GetBannerList($input:BannerListInput) {
  KBBanner {
    GetBannerList (input: $input) {
      success
      message
      data
    }
  }
}
`;

const MANAGE_BANNER_QUERY = `
query ManageBanner($input: ManageInput!) {
  KBBanner {
    Manage(input: $input) {
      success
      message
      data
    }
  }
}
`;

const BANNER_ARTICLE_QUERY = `
query GetArticleForBannerList($input: ArticleForBannerListInput) {
  KBBanner {
    GetArticleForBannerList(input: $input) {
      success
      message
      data
    }
  }
}
`;

// ─── GraphQL Functions ────────────────────────────────────────────────────────

const addBannerFromGraphQL = async (
  input: BannerMutationInput,
): Promise<BannerActionResponse> => {
  const articleId = Number(input.articleId);

  if (!articleId || Number.isNaN(articleId)) {
    throw new Error(`Invalid articleId: ${input.articleId}`);
  }

  const currentBanners = await fetchBannersFromGraphQL(input.lang,input.mode);

  const nextSeq =
    currentBanners.length > 0
      ? Math.max(...currentBanners.map((b) => Number(b.order))) + 1
      : 1;

  const payload = {
    input: {
      banners: [
        {
          action: "insert",
          id: 0,
          articleId,
          seq: nextSeq,
        },
      ],
    },
  };



  const res = await graphqlRequest<KBBannerManageGraphQLData>({
    query: MANAGE_BANNER_QUERY,
    variables: payload,
  });


  const result =
    (res as any)?.data?.KBBanner?.Manage ?? (res as any)?.KBBanner?.Manage;

  if (!result) {
    throw new Error("Invalid add banner response");
  }

  return {
    success: result.success,
    message: result.message,
  };
};

const deleteBannersFromGraphQL = async (
  id: string,
): Promise<BannerActionResponse> => {
  console.log("DELETE API CALLED", id);
  const res = await graphqlRequest<KBBannerManageGraphQLData>({
    query: MANAGE_BANNER_QUERY,
    variables: {
      input: {
        banners: [
          {
            action: "delete",
            id: Number(id),
            articleId: 0,
            seq: 0,
          },
        ],
      },
    },
  });
  const result = res.data.KBBanner.Manage;
  return { success: result.success, message: result.message };
};

const fetchBannersFromGraphQL = async (lang?: string, mode?: string): Promise<BannerItem[]> => {
  const res = await graphqlRequest<KBBannerGraphQLData>({
    query: GET_BANNER_LIST_QUERY,
    variables: {
      input: {
        lang: lang,
        mode: mode
      },
    },
  });

  const result = res.data.KBBanner.GetBannerList.data ?? [];

  return result
    .map((item: any) => ({
      ...item,
      id: String(item.id),
      articleId: String(item.articleId),
      order: Number(item.order ?? item.seq ?? 0),
    }))
    .sort((a: BannerItem, b: BannerItem) => a.order - b.order);
};

const reorderBannersFromGraphQL = async (
  bannerOrder: { articleId: number; id: number; order: number }[],
): Promise<BannerReorderResponse> => {
  const res = await graphqlRequest<KBBannerManageGraphQLData>({
    query: MANAGE_BANNER_QUERY,
    variables: {
      input: {
        banners: bannerOrder.map((item) => ({
          action: "move",
          id: item.id,
          articleId: item.articleId,
          seq: item.order,
        })),
      },
    },
  });

  const result = res.data.KBBanner.Manage;

  return {
    success: result.success,
    message: result.message,
  };
};

const bannerArticleFromGraphQL = async (
  filter?: ArticleFilter,
): Promise<BannerArticleResponse> => {
  const res = await graphqlRequest<KBBannerGetArticleGraphQLData>({
    query: BANNER_ARTICLE_QUERY,
    variables: {
      input: filter,
    },
  });

  const result = res.data.KBBanner.GetArticleForBannerList.data;

  return {
    total: result.total,
    hasMore: result.hasMore,
    currentPage: result.currentPage,
    totalPages: result.totalPages,
    data: (result.data ?? []).map((article: any) => ({
      ...article,
      articleId: String(article.articleId),
      status_value: article.status_value ?? "",
      category: article.category ?? "",
    })),
  };
};

// ─── Public API ───────────────────────────────────────────────────────────────

export const getBanners = (lang?:string,mode?:string): Promise<BannerItem[]> => fetchBannersFromGraphQL(lang,mode)

export const addBanner = (
  input: BannerMutationInput,
): Promise<BannerActionResponse> => addBannerFromGraphQL(input)

export const removeBanner = (id: string): Promise<BannerActionResponse> => {
  if (String(id).startsWith("temp-")) {
    return Promise.resolve({
      success: true,
      message: "Temp banner removed",
    });
  }

  return deleteBannersFromGraphQL(id)
};

export const reorderBanners = (
  bannerOrder: { articleId: number; id: number; order: number }[],
): Promise<BannerActionResponse> => reorderBannersFromGraphQL(bannerOrder)

export const getBannerArticleList = (
  filter?: ArticleFilter,
): Promise<BannerArticleResponse> => bannerArticleFromGraphQL(filter);
