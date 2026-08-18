import { useQuery } from "@tanstack/react-query";

import {
  DashboardBlockDataMap,
  DashboardBlockKey,
  DashboardBlockResponse,
} from "@/kms/dashboard/dtos/dashboard.dto";
import { getDashboardBlock } from "@/kms/dashboard/service/dashboard.service";

export const useDashboardBlockData = <K extends DashboardBlockKey>(block: K) =>
  useQuery<DashboardBlockResponse<DashboardBlockDataMap[K]>>({
    queryKey: ["kb-dashboard-block", block],
    queryFn: () => getDashboardBlock(block),
    staleTime: 1000 * 60 * 5,
  });
