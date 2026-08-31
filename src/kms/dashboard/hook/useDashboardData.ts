import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import {
  DashboardBlockDataMap,
  DashboardBlockKey,
  DashboardBlockResponse,
} from "@/kms/dashboard/dtos/dashboard.dto";
import { getDashboardBlock } from "@/kms/dashboard/service/dashboard.service";

export const useDashboardBlockData = <K extends DashboardBlockKey>(block: K) => {
  const location = useLocation();
  const query = useQuery<DashboardBlockResponse<DashboardBlockDataMap[K]>>({
    queryKey: ["kb-dashboard-block", block],
    queryFn: () => getDashboardBlock(block),
    staleTime: 1000 * 60 * 5,
    refetchOnMount: "always",
  });
  useEffect(() => {
    query.refetch();
  }, [location.key]);

  return query;
}
