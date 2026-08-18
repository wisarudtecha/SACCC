import type { DashboardBlockKey } from "@/kms/dashboard/dtos/dashboard.dto";
import type { BroadcastBlockKey } from "@/kms/broadcast/dtos/broadcast.dto";
import type { FileBlockKey } from "@/kms/files/dtos/files.dto";
import type { ArticleBlockKey } from "@/kms/articles/dtos/articles.dto";
import { API_CONFIG } from "@/core/config/api";
export type BannerDataSource = "mock" | "api";
export interface BannerBlockKey {
  list: string;
}
export enum MODE {
  LOCAL = "LOCAL",
  DEV = "DEV",
  PROD = "PROD",
}
export type DashboardDataSource = "mock" | "api";
export type BroadcastDataSource = "mock" | "api";
export type FileDataSource = "mock" | "api";
export type ArticleDataSource = "mock" | "api";
export type SourceDataSource = "mock" | "api";
export type CategoryDataSource = "mock" | "api";
export type KbTabCardDataSource = "mock" | "api";

// แก้ endpoint ของแต่ละ block ที่นี่เป็นหลัก ถ้า backend เปลี่ยน path
export const DashboardEndpoints: Record<DashboardBlockKey, string> = {
  metrics: "/kb/dashboard/metrics",
  trend: "/kb/dashboard/trend",
  categories: "/kb/dashboard/categories",
  searches: "/kb/dashboard/searches",
  articles: "/kb/dashboard/articles",
  activity: "/kb/dashboard/activity",
};

// แก้ endpoint ของหน้า Broadcast Manager แยกตาม block ได้ที่นี่
export const BroadcastEndpoints: Record<BroadcastBlockKey, string> = {
  summary: "/kb/broadcast/summary",
  list: "/kb/broadcast/list",
  log: "/kb/broadcast/log",
};

export const BroadcastNoticeEndpoint = "/kb/broadcast/notice";

// แก้ endpoint ของหน้า Files Manager แยกตาม block ได้ที่นี่
export const FileEndpoints: Record<FileBlockKey, string> = {
  list: "/kb/files/list",
  tree: "/kb/files/tree",
};

export const FileUploadUrlEndpoint = "/kb/files/upload-url";
export const FileDeleteEndpoint = "/kb/files/delete";
export const FilePresignEndpoint = "/kb/files/presign";
// แก้ endpoint ของหน้า Articles List แยกตาม block ได้ที่นี่
export const ArticleEndpoints: Record<ArticleBlockKey, string> = {
  list: "/kb/articles/list",
};
export const ArticleCreateEndpoint = "/kb/articles/create";
export const ArticleUpdateEndpointPrefix = "/kb/articles";
export const ArticleDetailEndpointPrefix = "/kb/articles";
export const BannerEndpoints = {
  list: "/kb/banners",
};

export const KbTabCardEndpoints = {
  list: "/kb/articles/tab",
} as const;

export const GraphQL = {
  // URL ของ GraphQL endpoint
  //URL:  "http://localhost:3001/graphql",
  URL:API_CONFIG.GRAPHQL_URL,
  // key ใน localStorage ที่เก็บ token
  AUTH_TOKEN_KEY: "access_token",
};
 
export const General = {
  MODE: MODE.LOCAL,
  // base URL ของ backend เช่น https://api.example.com
  API_BASE_URL: "/api",
  // เปลี่ยนเป็น "api" เมื่อต้องการยิง backend จริง
  DASHBOARD_DATA_SOURCE: "api" as DashboardDataSource,
  // เปลี่ยนเป็น "api" เมื่อต้องการยิง backend จริงสำหรับหน้า Broadcast Manager
  BROADCAST_DATA_SOURCE: "api" as BroadcastDataSource,
  // เปลี่ยนเป็น "api" เมื่อต้องการยิง backend จริงสำหรับหน้า Files Manager
  FILE_DATA_SOURCE: "api" as FileDataSource,
  // เปลี่ยนเป็น "api" เมื่อต้องการยิง backend จริงสำหรับหน้า Articles List
  ARTICLE_DATA_SOURCE: "api" as ArticleDataSource,
  // เปลี่ยนเป็น "api" เมื่อต้องการยิง backend จริงสำหรับหน้า Banner Management
  BANNER_DATA_SOURCE: "api" as BannerDataSource,
  // เปลี่ยนเป็น "api" เมื่อต้องการยิง backend จริงสำหรับหน้า Source Manager
  SOURCE_DATA_SOURCE: "api" as SourceDataSource,
  // เปลี่ยนเป็น "api" เมื่อต้องการยิง backend จริงสำหรับหน้า Category Manager
  CATEGORY_DATA_SOURCE: "api" as CategoryDataSource,
  // เปลี่ยนเป็น "api" เมื่อต้องการยิง backend จริงสำหรับ card-kb-tab
   KB_TAB_CARD_DATA_SOURCE: "api" as KbTabCardDataSource,
  ARTICLE_CREATE_ENDPOINT: ArticleCreateEndpoint,
  ARTICLE_UPDATE_ENDPOINT_PREFIX: ArticleUpdateEndpointPrefix,
  DASHBOARD_ENDPOINTS: DashboardEndpoints,
  BROADCAST_ENDPOINTS: BroadcastEndpoints,
  BROADCAST_NOTICE_ENDPOINT: BroadcastNoticeEndpoint,
  FILE_ENDPOINTS: FileEndpoints,
  FILE_UPLOAD_URL_ENDPOINT: FileUploadUrlEndpoint,
  FILE_DELETE_ENDPOINT: FileDeleteEndpoint,
  FILE_PRESIGN_ENDPOINT: FilePresignEndpoint,
};
