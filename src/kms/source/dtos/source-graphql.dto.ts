export interface KBSourceListItem {
  sourceId: number;
  sourceNameTh: string;
  sourceNameEn: string;
  sourceName: string;
  parentId: number | null;
  parentNameTh: string | null;
  parentNameEn: string | null;
  parentName: string | null;
  seq: number;
  totalArticle: number;
  createdDate: string;
  updatedDate: string;
}

export interface KBSourceListData {
  page: number;
  limit: number;
  totalPage: number;
  count: number;
  items: KBSourceListItem[];
}

export interface KBSourceListResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: unknown;
}

export interface KBSourceAddResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: unknown;
}

export type KBSourceUpdateResponse = KBSourceAddResponse;

export interface KBSourceDeleteResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: unknown;
}

export interface KBSourceGraphQLData {
  KBSource: {
    GetSourceList: KBSourceListResponse;
    AddSource: KBSourceAddResponse;
    UpdateSource: KBSourceUpdateResponse;
    DeleteSource: KBSourceDeleteResponse;
  };
}
