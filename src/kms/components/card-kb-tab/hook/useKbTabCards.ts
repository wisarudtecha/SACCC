import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import type {
  KbTabCardBlockResponse,
  KbTabCardFilter,
  KbTabCardListResult,
} from "../dtos/kb-tab-card.dto";
import { getKbTabCardList } from "../service/kb-tab-card.service";

export const useKbTabCards = (filter: KbTabCardFilter = {}) => {
  const location = useLocation();
  const query = useQuery<KbTabCardBlockResponse<KbTabCardListResult>>({
    queryKey: ["kb-tab-cards", filter],
    queryFn: () => getKbTabCardList(filter),
    staleTime: 1000 * 60 * 5,
    refetchOnMount: "always",
  });
  useEffect(() => {
    query.refetch();
  }, [location.key]);

  return query;
}
