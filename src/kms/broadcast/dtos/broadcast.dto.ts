export type BroadcastBlockKey = "summary" | "list" | "log";

export type BroadcastStatus =
  | "all"
  | "scheduled"
  | "published"
  | "expired"
  | "draft";

export type BroadcastDataSource = "mock" | "api";

export interface BroadcastSummaryItem {
  id: BroadcastStatus;
  count: number;
}

export interface BroadcastItem {
  id: string;
  title: string;
  message: string;
  status: Exclude<BroadcastStatus, "all">;
  startDate: string;
  endDate: string;
  createdDate?: string;
  updatedDate?: string;
}

export interface BroadcastMutationInput {
  title: string;
  message: string;
  statusBroadcastId: number;
  startDate: string | null;
  endDate: string | null;
}

export interface BroadcastEntryNoticeItem {
  title: string;
  message: string;
}

export interface BroadcastEntryNotice {
  id: string;
  title: string;
  items: BroadcastEntryNoticeItem[];
}

export interface BroadcastBlockMeta {
  key: BroadcastBlockKey;
  endpoint: string;
  source: BroadcastDataSource;
}

export interface BroadcastBlockResponse<TData> {
  data: TData;
  meta: BroadcastBlockMeta;
}

export interface BroadcastLogItem extends BroadcastItem {
  publishedAt?: string;
  audience?: string;
}

export interface BroadcastBlockDataMap {
  summary: BroadcastSummaryItem[];
  list: BroadcastItem[];
  log: BroadcastLogItem[];
}

export interface BroadcastPagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPage: number;
}

export interface BroadcastListResult {
  items: BroadcastItem[];
  pagination: BroadcastPagination;
  meta: {
    endpoint: string;
    source: BroadcastDataSource;
  };
}
