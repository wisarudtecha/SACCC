import { useQuery } from "@tanstack/react-query";
import {  useLocation } from "react-router-dom";
import { useEffect } from "react";
import {
  BroadcastBlockDataMap,
  BroadcastBlockKey,
  BroadcastStatus,
} from "@/kms/broadcast/dtos/broadcast.dto";
import { getBroadcastBlock } from "@/kms/broadcast/service/broadcast.service";

export const useBroadcastBlockData = <K extends BroadcastBlockKey>(
  block: K,
  options?: { status?: BroadcastStatus },
) =>{
   const location = useLocation();
   const query =  useQuery({
    queryKey: ["kb-broadcast-block", block, options?.status ?? "all"],
    queryFn: () => getBroadcastBlock(block, options),
    staleTime: 1000 * 60 * 5,
    refetchOnMount: "always"
  }) as {
    data?: {
      data: BroadcastBlockDataMap[K];
      meta: { endpoint: string; source: "mock" | "api" };
    };
    isLoading: boolean;
    isFetching: boolean;
    isError: boolean;
    refetch: () => Promise<unknown>;
  }
    useEffect(() => {
    query.refetch();
  }, [location.key]);

  return query;
};
