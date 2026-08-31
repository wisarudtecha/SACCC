import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import type {
  DashboardBlockResponse,
  DashboardLowArticle,
  DashboardLowArticleMode,
} from "@/kms/dashboard/dtos/dashboard.dto";
import { getLowArticles } from "@/kms/dashboard/service/dashboard.service";

export const useDashboardLowArticles = (mode: DashboardLowArticleMode) => {
  const location = useLocation();
  const query = useQuery<DashboardBlockResponse<DashboardLowArticle[]>>({
    queryKey: ["kb-dashboard-low-articles", mode],
    queryFn: () => getLowArticles(mode),
    staleTime: 1000 * 60 * 5,
    refetchOnMount: "always",
  });
  useEffect(() => {
    query.refetch();
  }, [location.key]);

  return query;
}
