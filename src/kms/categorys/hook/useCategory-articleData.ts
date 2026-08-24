import { useQuery,useInfiniteQuery } from "@tanstack/react-query";
import { FileBlockDataMap, FileBlockKey } from "@/kms/categorys/dtos/files.dto";
import { CategoryArticleListParams } from "@/kms/categorys/dtos/category-article-graphql.dto"
import { getCategoryTree, fetchApiCategoryArticle } from "@/kms/categorys/service/category-articles.service";

export const useCategoryTreeBlockData = <K extends FileBlockKey>() =>
  useQuery({
    queryKey: ["kb-category-article-block"],
    queryFn: () => getCategoryTree(),
    staleTime: 1000 * 60 * 3,
  }) as {
    data?: {
      data: FileBlockDataMap[K];
      meta: { endpoint: string; source: "mock" | "api" };
    };
    isLoading: boolean;
    isFetching: boolean;
    isError: boolean;
    refetch: () => Promise<unknown>;
  };
 
export const useCategoryArticleBlockData = (
  params: CategoryArticleListParams = {},
) =>
  useInfiniteQuery({
    queryKey: [
      'kb-category-article-block',
      params.search,
      params.categoryId,
      params.limit,
    ],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => {
      return fetchApiCategoryArticle({
        ...params,
        cursor: pageParam,
      });
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.data?.pagination?.hasMore) {
        return undefined;
      }
      return lastPage.data.pagination.nextCursor ?? undefined;
    },

    staleTime: 1000 * 60 * 3,
  });