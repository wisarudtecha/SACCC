
import { graphqlRequest } from "@/kms/common/graphql.service";

import type {
  KBCMSServiceTypeArticleGraphQLData,
  GetCategoryArticleTreeResponseDto,
  KBCMSServiceArticleGraphQLData,
  GetServiceArticleResponseDto,
  KBCMSServiceArticleGraphQLDelData,
  DelServiceArticleResponseDto
} from "@/kms/components/casetype-map-articles/dto/casetype-map-articles.dto";

// ─── GraphQL queries ──────────────────────────────────────────────────────────

const GET_CASETYPE_MAP_ARTICLES_THREE_QUERY = `
  query KBCMSServiceTypeArticleQuery {
    KBCMSServiceTypeArticle {
      GetCategoryArticleTree{
        statusCode
        success
        message
        data
      }
    }
  }
`;

// ─── API fetch ────────────────────────────────────────────────────────────────

export const getCategoryArticleTree = async (
): Promise<GetCategoryArticleTreeResponseDto> => {
  const res = await graphqlRequest<KBCMSServiceTypeArticleGraphQLData>({
    query: GET_CASETYPE_MAP_ARTICLES_THREE_QUERY
  });
  return res.data.KBCMSServiceTypeArticle.GetCategoryArticleTree;
};

const SYNC_SERVICE_TYPE_ARTICLES_QUERY = `
  query SyncServiceTypeArticles($input: SyncServiceTypeArticleInput) {
    KBCMSServiceTypeArticle {
        SyncServiceTypeArticles(input: $input) {
          success
          message
          data
        }
     }
  }
`;

export interface SyncServiceTypeArticleInput {
  cmsServiceTypeId: string;
  artId: number[];
}
export interface ServiceTypeArticlesInput {
  cmsServiceTypeId: string;
}

interface SyncServiceTypeArticlesGraphQLData {
  KBCMSServiceTypeArticle?: {
    SyncServiceTypeArticles: {
      success: boolean;
      message?: string;
      data?: any;
    };
  }
}

export const saveServiceToArticle = async (
  input: SyncServiceTypeArticleInput
): Promise<any> => {
  const res = await graphqlRequest<SyncServiceTypeArticlesGraphQLData>({
    query: SYNC_SERVICE_TYPE_ARTICLES_QUERY,
    variables: {
      input: {
        cmsServiceTypeId: input.cmsServiceTypeId,
        artId: input.artId,
      },
    },
  });
  const result = res.data?.KBCMSServiceTypeArticle?.SyncServiceTypeArticles;
  if (!result?.success) {
    throw new Error(result?.message ?? "Unable to save articles to KB");
  }
  return result.data;
};

const GET_SERVICE_MAP_ARTICLES_QUERY = `
  query GetServiceTypeArticles ($input: GetServiceTypeArticlesInput){
    KBCMSServiceTypeArticle {
      GetServiceTypeArticles (input: $input){
        statusCode
        success
        message
        data
      }
    }
  }
`;

// ─── API fetch ────────────────────────────────────────────────────────────────

export const getServiceArticle = async (
  input: ServiceTypeArticlesInput
): Promise<GetServiceArticleResponseDto> => {
  const res = await graphqlRequest<KBCMSServiceArticleGraphQLData>({
    query: GET_SERVICE_MAP_ARTICLES_QUERY,
    variables: {
      input: {
        cmsServiceTypeId: input.cmsServiceTypeId
      },
    },
  });
  return res.data.KBCMSServiceTypeArticle.GetServiceTypeArticles;
};




const DELETE_SERVICE_MAP_ARTICLES_QUERY = `
  query DelServiceTypeArticles ($input: GetServiceTypeArticlesInput) {
    KBCMSServiceTypeArticle {
      DelServiceTypeArticles (input: $input) {
        statusCode
        success
        message
        data
      }
    }
  }
`;

// ─── API fetch ────────────────────────────────────────────────────────────────

export const deleteServiceArticle = async (
  input: ServiceTypeArticlesInput
): Promise<DelServiceArticleResponseDto> => {
  const res = await graphqlRequest<KBCMSServiceArticleGraphQLDelData>({
    query: DELETE_SERVICE_MAP_ARTICLES_QUERY,
    variables: {
      input: {
        cmsServiceTypeId: input.cmsServiceTypeId,
      },
    },
  });

  return res.data.KBCMSServiceTypeArticle.DelServiceTypeArticles;
};






