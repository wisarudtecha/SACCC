export interface KBBroadcastStatusOverviewItem {
  key: number;
  label: string;
  count: number;
}

export interface KBBroadcastStatusOverviewData {
  total: number;
  items: KBBroadcastStatusOverviewItem[];
}

export interface KBBroadcastStatusOverviewResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: KBBroadcastStatusOverviewData;
}

export interface KBBroadcastListItem {
  broadcastId: number;
  title: string;
  description: string | null;
  status: number;
  startDate: string;
  endDate: string;
  createdById: number;
  createdDate: string;
  updatedById: number;
  updatedDate: string;
}

export interface KBBroadcastListData {
  page: number;
  limit: number;
  totalCount: number;
  totalPage: number;
  count: number;
  items: KBBroadcastListItem[];
}

export interface KBBroadcastListResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: KBBroadcastListData;
}

export interface KBBroadcastAddResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: KBBroadcastListItem;
}

export type KBBroadcastUpdateResponse = KBBroadcastAddResponse;

export interface KBBroadcastDeleteData {
  broadcastId: number;
  updatedDate: string;
}

export interface KBBroadcastDeleteResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: KBBroadcastDeleteData;
}

export interface KBBroadcastPopupItem {
  broadcastId: number;
  title: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  broadcaststatusId: number;
  statusBroadcast: string;
  displayStatus: number;
}

export interface KBBroadcastPopupData {
  count: number;
  items: KBBroadcastPopupItem[];
}

export interface KBBroadcastPopupResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: KBBroadcastPopupData;
}

export interface KBBroadcastAcceptData {
  userId: number;
  acceptedIds: number[];
  acceptedCount: number;
  skippedCount: number;
}

export interface KBBroadcastAcceptResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: KBBroadcastAcceptData;
}

export interface KBBroadcastGraphQLData {
  KBBroadcast: {
    GetBroadcastStatusOverviewList: KBBroadcastStatusOverviewResponse;
    GetBroadcastList: KBBroadcastListResponse;
    AddBroadcast: KBBroadcastAddResponse;
    UpdateBroadcast: KBBroadcastUpdateResponse;
    DeleteBroadcast: KBBroadcastDeleteResponse;
    GetPopupList: KBBroadcastPopupResponse;
    AcceptBroadcast: KBBroadcastAcceptResponse;
  };
}
