import { useQuery  } from "@tanstack/react-query";
import { QueryClient } from '@tanstack/react-query';
import { ArticleFilter } from "@/kms/articles//dtos/articles.dto";
import {
  getArticleBlock,
  //getArticleComments,
  // getArticleDetail,
  getArticleDetailHeader,
  getArticleDetailContent,
  getArticleDetailInfo,
  getArticleStatus,
  getArticlePriority,
  getArticleAllUser,
  getArticleOwnership,
  getArticleMasterData,
  getArticleRelations,
  getArticleSources,
  getArticleDetailStatusActivity,
  getArticleViewGroup,
  putArticleCountView
} from "@/kms/articles/service/articles.service";

export const useArticleListData = (filter?: ArticleFilter) =>
  useQuery({
    queryKey: ["kb-articles-list", filter],
    queryFn: () => getArticleBlock("list", filter),
    staleTime: 30_000,
  });

// export const useArticleDetailData = (id: string) =>
//   useQuery({
//     queryKey: ["kb-article-detail", id],
//     queryFn: () => getArticleDetail(id),
//     staleTime: 30_000,
//     enabled: !!id,
//   });

export const useArticleDetailStatusActivityData = (artid: number) =>
  useQuery({
    queryKey: ["kb-article-detail-status-activity-log", artid],
    queryFn: () => getArticleDetailStatusActivity(artid),
    staleTime: 30_000,
    enabled: !!artid,
  });

export const useArticleStatusData = () =>
  useQuery({
    queryKey: ["kb-articles-status"],
    queryFn: () => getArticleStatus(),
    staleTime: 30_000,
  });


export const useArticlePriorityData = () =>
  useQuery({
    queryKey: ["kb-articles-priority"],
    queryFn: () => getArticlePriority(),
    staleTime: 30_000,
  });

export const useArticleUserData = () =>
  useQuery({
    queryKey: ["kb-articles-user"],
    queryFn: () => getArticleAllUser(),
    staleTime: 30_000,
  });

export const useArticleOwnershipData = () =>
  useQuery({
    queryKey: ["kb-articles-ownership"],
    queryFn: () => getArticleOwnership(),
    staleTime: 30_000,
  });

export const useArticleSortData = () =>
  useQuery({
    queryKey: ["kb-articles-sort"],
    queryFn: () => getArticleAllUser(),
    staleTime: 30_000,
  });


export const useArticleMasterData = (
  f: {
    item_key: string
  }) =>
  useQuery({
    queryKey: ["kb-articles-master-data"],
    queryFn: () => getArticleMasterData(f),
    staleTime: 30_000,
  });

export const useArticleDetailHeader = (artId: number, enabled = true) =>
  useQuery({
    queryKey: ["kb-article-detail-header", artId],
    queryFn: () => getArticleDetailHeader(artId),
    staleTime: 30_000,
    enabled: !!artId && enabled,
  });

export const useArticleDetailContent = (artId: number, enabled = true) =>
  useQuery({
    queryKey: ["kb-article-detail-content", artId],
    queryFn: () => getArticleDetailContent(artId),
    staleTime: 30_000,
      enabled: !!artId && enabled,
  });

export const useArticleDetailInfo = (artId: number, enabled = true) =>
  useQuery({
    queryKey: ["kb-article-detail-info", artId],
    queryFn: () => getArticleDetailInfo(artId),
    staleTime: 30_000,
     enabled: !!artId && enabled,
  });

export const useArticleRelations = () =>
  useQuery({
    queryKey: ["kb-article-relations"],
    queryFn: () => getArticleRelations(),
    staleTime: 60_000,
  });

export const useArticleSources = () =>
  useQuery({
    queryKey: ["kb-article-sources"],
    queryFn: () => getArticleSources(),
    staleTime: 60_000,
  });

export const useArticleViewGroup = () =>
  useQuery({
    queryKey: ["kb-article-view-groups"],
    queryFn: () => getArticleViewGroup(),
    staleTime: 60_000,
  });

  export const useArticleCountView = (id:number) =>
  useQuery({
    queryKey: ["kb-article-count-view",id],
    queryFn: () => putArticleCountView(id),
    enabled: !!id,
    staleTime: 60_000,
  });



export const refreshArticleDetail = async (
  queryClient: QueryClient,
  artId: number
) => {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: ["kb-article-detail-header", artId],
    }),
    queryClient.invalidateQueries({
      queryKey: ["kb-article-detail-content", artId],
    }),
    queryClient.invalidateQueries({
      queryKey: ["kb-article-detail-info", artId],
    }),
    queryClient.invalidateQueries({
      queryKey: ["kb-article-detail-status-activity-log", artId],
    }),
  ]);
};