export type KbTabCardBlockKey = "list";
export type KbTabCardDataSource = "mock" | "api";

export interface KbTabCardScore {
  value: number;
  min: number;
  max: number;
}

export interface KbTabCard {
  id: string;
  title: string;
  description: string;
  category: string;
  categoryFullPath: string;
  tags: string[];
  views: number;
  likes: number;
  score?: KbTabCardScore;
  updatedAt: string;
  url?: string;
}

export interface KbTabCardTab {
  key: string;
  label_th: string;
  label_en: string;
  count: number;
}

export interface KbTabCardFilter {
  search?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}

export interface KbTabCardListResult {
  items: KbTabCard[];
  total: number;
  page: number;
  pageSize: number;
  tabs: KbTabCardTab[];
}

export interface KbTabCardBlockMeta {
  key: KbTabCardBlockKey;
  endpoint: string;
  source: KbTabCardDataSource;
}

export interface KbTabCardBlockResponse<TData> {
  data: TData;
  meta: KbTabCardBlockMeta;
}

export interface KbTabCardBlockDataMap {
  list: KbTabCardListResult;
}
