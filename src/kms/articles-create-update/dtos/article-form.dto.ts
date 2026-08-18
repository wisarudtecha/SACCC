export type ArticleFormStep = "create" | "submit" | "approve" | "publish";
export type ArticleFormTab = "basic" | "content" | "visibility";
export type ArticleFormMode = "create" | "edit";

export interface ArticleFormInput {
  // Basic Info
  title: string;
  version: string;
  description: string;
  priority: number | null;
  source: number | null;
  reserveDate: string;
  ownership: number | null;
  relatedArticles: number[];
  categoryKey: string;
  // Content
  attachments: { id?: number; name: string; path?: string; sizeLabel?: string }[];
  content: string;
  // Visibility & Settings
  startDate: string;
  endDate: string;
  viewableGroups: number[];
  keywords: { id?: number; title: string }[];
}

export interface ArticleFormResult {
  id: string;
  title: string;
  step: ArticleFormStep;
  createdAt: string;
}

export interface ArticleFormBlockMeta {
  endpoint: string;
  source: "mock" | "api";
}

export interface ArticleFormResponse {
  data: ArticleFormResult;
  meta: ArticleFormBlockMeta;
}

export interface ArticleFormDetail extends ArticleFormInput {
  id: string;
  step: ArticleFormStep;
  createdAt: string;
  updatedAt: string;
  relatedArticleOptions?: { id: number; title: string }[];
  viewGroupArticleOptions?: { id: number; title: string }[];
}



export interface ArticleStatusInput {
  // Basic Info
  id: number;
  comment: string;
  status_id: number;
}


export interface ArticleStatusResult {
  id: string;
}
