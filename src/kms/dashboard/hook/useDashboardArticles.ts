import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import type { ArticleListType } from "@/kms/dashboard/dtos/dashboard-graphql.dto";
import type { DashboardArticle, DashboardBlockResponse } from "@/kms/dashboard/dtos/dashboard.dto";
import { getArticlesList } from "@/kms/dashboard/service/dashboard.service";

export const useDashboardArticles = (type: ArticleListType) => {
  const location = useLocation();
  const query = useQuery<DashboardBlockResponse<DashboardArticle[]>>({
    queryKey: ["kb-dashboard-articles", type],
    queryFn: () => getArticlesList(type),
    staleTime: 1000 * 60 * 5,
    refetchOnMount: "always",
  });
  useEffect(() => {
    query.refetch();
  }, [location.key]);

  return query;
}
