import { useQuery } from "@tanstack/react-query";

import type {
  KbTabCardBlockResponse,
  KbTabCardFilter,
  KbTabCardListResult,
} from "../dtos/kb-tab-card.dto";
import { getKbTabCardList } from "../service/kb-tab-card.service";

export const useKbTabCards = (filter: KbTabCardFilter = {}) =>
  useQuery<KbTabCardBlockResponse<KbTabCardListResult>>({
    queryKey: ["kb-tab-cards", filter],
    queryFn: () => getKbTabCardList(filter),
    staleTime: 1000 * 60 * 5,
  });
