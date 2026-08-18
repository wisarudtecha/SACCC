export interface KBCategoryListResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: unknown;
}

export interface KBCategoryMoveResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: unknown;
}

export interface KBCategoryAddResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: unknown;
}

export interface KBCategoryUpdateResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: unknown;
}

export interface KBCategoryDeleteResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: unknown;
}

export interface KBCategoryGraphQLData {
  KBCategory: {
    GetCategoryList: KBCategoryListResponse;
    MoveCategory: KBCategoryMoveResponse;
    AddCategory: KBCategoryAddResponse;
    UpdateCategory: KBCategoryUpdateResponse;
    DeleteCategory: KBCategoryDeleteResponse;
  };
}
