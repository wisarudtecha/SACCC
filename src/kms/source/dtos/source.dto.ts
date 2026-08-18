import type { SourceDataSource } from "@/kms/constant";

export interface SourceItem {
  id: string;
  name_th: string;
  name_en: string;
  name: string;
  parentId: string | null;
  parentNameTh: string | null;
  parentNameEn: string | null;
  parentName: string | null;
  seq: number;
  totalArticle: number;
  createdDate: string;
  updatedDate: string;
}

export interface SourceMutationInput {
  name_th: string;
  name_en: string;
  seq: number;
}

export interface SourcePagination {
  page: number;
  limit: number;
  totalPage: number;
  count: number;
}

export interface SourceBlockMeta {
  source: SourceDataSource;
}

export interface SourceBlockResponse {
  items: SourceItem[];
  pagination: SourcePagination;
  meta: SourceBlockMeta;
}
