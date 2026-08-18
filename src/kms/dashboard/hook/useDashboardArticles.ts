import { useQuery } from "@tanstack/react-query";

import type { ArticleListType } from "@/kms/dashboard/dtos/dashboard-graphql.dto";
import type { DashboardArticle, DashboardBlockResponse } from "@/kms/dashboard/dtos/dashboard.dto";
import { getArticlesList } from "@/kms/dashboard/service/dashboard.service";

export const useDashboardArticles = (type: ArticleListType) =>
  useQuery<DashboardBlockResponse<DashboardArticle[]>>({
    queryKey: ["kb-dashboard-articles", type],
    queryFn: () => getArticlesList(type),
    staleTime: 1000 * 60 * 5,
  });
