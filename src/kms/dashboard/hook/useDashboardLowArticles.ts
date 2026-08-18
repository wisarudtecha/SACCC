import { useQuery } from "@tanstack/react-query";

import type {
  DashboardBlockResponse,
  DashboardLowArticle,
  DashboardLowArticleMode,
} from "@/kms/dashboard/dtos/dashboard.dto";
import { getLowArticles } from "@/kms/dashboard/service/dashboard.service";

export const useDashboardLowArticles = (mode: DashboardLowArticleMode) =>
  useQuery<DashboardBlockResponse<DashboardLowArticle[]>>({
    queryKey: ["kb-dashboard-low-articles", mode],
    queryFn: () => getLowArticles(mode),
    staleTime: 1000 * 60 * 5,
  });
