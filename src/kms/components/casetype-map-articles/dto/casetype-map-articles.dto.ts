
export interface CategoryArticleTreeNodeDto {
  id?: string | number;
  label?: string;
  label_th?: string;
  label_en?: string | null;
  children?: CategoryArticleTreeNodeDto[] | null;
}

export interface GetCategoryArticleTreeResponseDto {
  statusCode?: number;
  message?: string;
  data?: CategoryArticleTreeNodeDto[];
}

export class ServiceTypeMappingArticlesDto {
  cmsServiceTypeId!: string;
  artId!: number[]
}

export class ServiceTypeArticlesDto {
  cmsServiceTypeId!: string;
}


export interface KBCMSServiceTypeArticleGraphQLData {
  KBCMSServiceTypeArticle: {
    GetCategoryArticleTree: GetCategoryArticleTreeResponseDto;
  };
}


export interface GetServiceArticleResponseDto {
  statusCode?: number;
  message?: string;
  data?: number[];
}


export interface KBCMSServiceArticleGraphQLData {
  KBCMSServiceTypeArticle: {
    GetServiceTypeArticles: GetServiceArticleResponseDto;
  };
}


export interface DelServiceArticleResponseDto {
  statusCode?: number;
  message?: string;
  data?:{
    deletedCount?:number
  };
}


export interface KBCMSServiceArticleGraphQLDelData {
  KBCMSServiceTypeArticle: {
    DelServiceTypeArticles: DelServiceArticleResponseDto;
  };
}
 