import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import {
  getBanners,
  addBanner,
  removeBanner,
  reorderBanners,
  getBannerArticleList
} from "@/kms/banner/service/banner.service";
import type { BannerMutationInput, ArticleFilter } from "@/kms/banner/dtos/banner.dto";


export const BANNER_QUERY_KEY = ["kb-banners"];

export const useBannerList = (lang?: string, mode?: string) => {
  const location = useLocation();
  const query = useQuery({
    // queryKey: BANNER_QUERY_KEY,
    queryKey: ['kb-banners', lang, mode],
    queryFn: async () => await getBanners(lang, mode),
    staleTime: 30_000,
    refetchOnMount: "always",
  });
  useEffect(() => {
    query.refetch();
  }, [location.key]);

  return query;
}

// export const useBannerList = (lang?:string,mode?:string) =>
// useQuery({
//     queryKey: BANNER_QUERY_KEY,
//   queryFn: getBanners(lang,mode),
//   staleTime: 30_000,
// });


export const useAddBanner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BannerMutationInput) => addBanner(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: BANNER_QUERY_KEY });
    },
  });
};

export const useRemoveBanner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removeBanner(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: BANNER_QUERY_KEY });
    },
  });
};

export const useReorderBanners = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bannerOrder: { articleId: number, id: number, order: number }[]) => reorderBanners(bannerOrder),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: BANNER_QUERY_KEY });
    },
  });
};

// export const useArticleListData = (filter?: ArticleFilter) =>{
//  console.log("useArticleListData called with filter:", filter);
//    const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: (filter?: ArticleFilter) =>
//       getBannerArticleList(filter),
//     onSuccess: () => {
//       void queryClient.invalidateQueries({ queryKey: BANNER_QUERY_KEY });
//     },
//   });
// }

export const useArticleListData = (filter?: ArticleFilter) => {
  return useQuery({
    queryKey: ["banner-article-list", filter],
    queryFn: () => getBannerArticleList(filter),
  });
};






